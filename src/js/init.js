/* eslint no-param-reassign: ["error", { "props": false }] */

import * as yup from 'yup';
import onChange from 'on-change';
import { uniqueId, differenceBy } from 'lodash';
import i18n from './libs/i18n.js';
import formProcessStates from './constants.js';
import parseRSS from './rssParser.js';
import {
  render,
  renderError,
  renderForm,
} from './renderers/index.js';

const scheme = yup.string().url().required();

const getProxyFor = (url) => `https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(url)}`;
const isValidURL = (url) => scheme.isValidSync(url);
const isDuplicateRSS = (state, url) => state.channels
  .find((channel) => channel.url === url) !== undefined;

const updateState = (previousState, currentState) => Object.assign(previousState, currentState);

const loadRssFeed = (url) => fetch(getProxyFor(url))
  .then((response) => response.json())
  .then((data) => data.contents);

const loadNewPosts = (feeds) => {
  const requests = feeds.map(({ url }) => loadRssFeed(url));
  return Promise.all(requests)
    .then((rssFeeds) => rssFeeds.flatMap((rssFeed, index) => {
      const currentFeed = feeds[index];
      const [, posts] = parseRSS(rssFeed);
      return posts.map((post) => ({
        ...post,
        channelId: currentFeed.id,
        id: uniqueId(),
      }));
    }));
};

const listenToNewPosts = (watchedState) => {
  if (watchedState.channels.length === 0) {
    setTimeout(listenToNewPosts, 5000, watchedState);
    return;
  }
  loadNewPosts(watchedState.channels)
    .then((newPosts) => {
      const newUniquePosts = differenceBy(
        newPosts,
        watchedState.posts,
        ({ pubDate }) => pubDate < watchedState.lastTimePostsUpdate,
      );
      updateState(watchedState, {
        posts: [...newUniquePosts, ...watchedState.posts],
        lastTimePostsUpdate: Date.now(),
      });
    })
    .catch((error) => {
      console.log('Интернет соединение недоступно.');
      throw error;
    })
    .finally(() => {
      setTimeout(listenToNewPosts, 5000, watchedState);
    });
};

export default () => {
  const state = {
    channels: [],
    posts: [],
    lastTimePostsUpdate: 0,
    form: {
      valid: true,
      processState: formProcessStates.filling,
      processMessage: '',
    },
    onlineState: {
      message: '',
      isOnline: true,
    },
  };

  const formElements = {
    form: document.querySelector('.feed-form'),
    input: document.querySelector('[name="add-rss"]'),
    submitButton: document.querySelector('button[type="submit"]'),
    messageContainer: document.querySelector('.message-container'),
  };

  const watchedState = onChange(state, (path) => {
    console.log(path);
    if (path.startsWith('form')) {
      renderForm(state, formElements);
    }

    if (path === 'posts') {
      render(state);
    }

    if (path === 'channels') {
      render(state);
    }

    if (path.startsWith('onlineState')) {
      renderError(watchedState);
    }
  });

  formElements.form.addEventListener('submit', (event) => {
    event.preventDefault();

    updateState(watchedState.form, {
      processState: formProcessStates.sending,
    });

    const formData = new FormData(event.target);
    const rssUrl = formData.get('add-rss');

    if (isDuplicateRSS(watchedState, rssUrl)) {
      updateState(watchedState.form, {
        valid: false,
        processState: formProcessStates.failed,
        processMessage: i18n.t('errorMessages.duplicateRSS'),
      });
      return;
    }

    if (!isValidURL(rssUrl)) {
      updateState(watchedState.form, {
        valid: false,
        processState: formProcessStates.failed,
        processMessage: i18n.t('errorMessages.invalidURL'),
      });
      return;
    }

    updateState(watchedState.form, {
      valid: true,
    });

    loadRssFeed(rssUrl)
      .then((data) => {
        const [channel, posts] = parseRSS(data);

        const newChannel = {
          ...channel,
          id: uniqueId(),
          url: rssUrl,
        };

        const newPosts = posts.map((post) => ({
          ...post,
          id: uniqueId(),
          channelId: newChannel.id,
        }));

        updateState(watchedState, {
          channels: [newChannel, ...watchedState.channels],
          posts: [...newPosts, ...watchedState.posts],
          lastTimePostsUpdate: Date.now(),
        });

        updateState(watchedState.form, {
          processState: formProcessStates.finished,
          processMessage: i18n.t('successMessages.addRSS'),
        });

        setTimeout(() => {
          updateState(watchedState.form, {
            processState: formProcessStates.filling,
            processMessage: '',
          });
        }, 2000);
      })
      .catch((error) => {
        const errorMessage = error.message;

        if (errorMessage === i18n.t('errorMessages.invalidRSS')) {
          updateState(watchedState.form, {
            processMessage: i18n.t('errorMessages.invalidRSS'),
          });
        }

        if (errorMessage === i18n.t('errorMessages.network')) {
          updateState(watchedState.form, {
            processMessage: i18n.t('errorMessages.network'),
          });
        }

        updateState(watchedState.form, {
          processState: formProcessStates.failed,
        });

        throw error;
      });
  });

  render(watchedState);
  listenToNewPosts(watchedState);
};
