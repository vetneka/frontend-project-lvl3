import * as yup from 'yup';
import { uniqueId, differenceBy } from 'lodash';
import axios from 'axios';
import i18next from 'i18next';

import ru from '../locales/ru/translation.js';

import { formProcessStates, messagesTypes } from './constants.js';
import parseRSS from './rssParser.js';
import initView from './initView.js';
import initModal from './initModal.js';

const scheme = yup.string().trim().required().url();

const getProxyFor = (url) => `https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(url)}&disableCache=true`;
const isValidURL = (url) => scheme.isValidSync(url);
const isDuplicateRSS = (state, url) => state.channels
  .find((channel) => channel.url === url) !== undefined;

const updateState = (previousState, currentState) => Object.assign(previousState, currentState);

const loadRssFeed = (url) => axios(getProxyFor(url))
  .then((response) => {
    const { contents } = response.data;
    return contents;
  })
  .catch(() => {
    throw new Error(messagesTypes.network);
  });

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
      messageType: messagesTypes.empty,
    },
    uiState: {
      viewedPostsIds: new Set(),
    },
  };

  const elements = {
    feedForm: {
      form: document.querySelector('.feed-form'),
      input: document.querySelector('[name="add-rss"]'),
      submitButton: document.querySelector('button[type="submit"]'),
      messageContainer: document.querySelector('.message-container'),
    },

    feeds: document.querySelector('.feeds'),
    posts: document.querySelector('.posts'),

    postPreviewModal: document.querySelector('#postPreviewModal'),
  };

  const i18nextInstance = i18next.createInstance();

  i18nextInstance.init({
    lng: 'ru',
    resources: {
      ru,
    },
  });

  const watched = initView(state, elements, i18nextInstance);
  const postPreviewModal = initModal(elements.postPreviewModal);

  elements.posts.addEventListener('click', (event) => {
    const button = event.target;
    if (button.dataset.toggle !== 'modal') {
      return;
    }
    event.preventDefault();

    const currentPostId = button.dataset.postId;
    const {
      id,
      title,
      description,
      link,
    } = watched.posts.find((post) => post.id === currentPostId);

    updateState(watched.uiState, {
      viewedPostsIds: watched.uiState.viewedPostsIds.add(id),
    });

    updateState(postPreviewModal.state, {
      content: {
        title,
        description,
        link,
      },
      isOpened: true,
    });
  });

  elements.feedForm.form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const rssUrl = formData.get('add-rss');

    updateState(watched.form, {
      processState: formProcessStates.sending,
    });

    if (isDuplicateRSS(watched, rssUrl)) {
      updateState(watched.form, {
        valid: false,
        messageType: messagesTypes.duplicateRSS,
        processState: formProcessStates.failed,
      });
      return;
    }

    if (!isValidURL(rssUrl)) {
      updateState(watched.form, {
        valid: false,
        messageType: messagesTypes.invalidURL,
        processState: formProcessStates.failed,
      });
      return;
    }

    updateState(watched.form, {
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

        updateState(watched, {
          channels: [newChannel, ...watched.channels],
          posts: [...newPosts, ...watched.posts],
          lastTimePostsUpdate: Date.now(),
        });

        updateState(watched.form, {
          processState: formProcessStates.finished,
          messageType: messagesTypes.addRSS,
        });
      })
      .catch((error) => {
        const errorType = error.message;

        switch (errorType) {
          case messagesTypes.invalidRSS: {
            updateState(watched.form, {
              messageType: messagesTypes.invalidRSS,
            });
            break;
          }
          case messagesTypes.network: {
            updateState(watched.form, {
              messageType: messagesTypes.network,
            });
            break;
          }
          default:
            break;
        }

        updateState(watched.form, {
          processState: formProcessStates.failed,
        });
      });
  });

  listenToNewPosts(watched);
};
