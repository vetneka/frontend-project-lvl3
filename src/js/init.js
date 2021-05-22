import * as yup from 'yup';
import { differenceBy } from 'lodash';
import axios from 'axios';

import i18next from 'i18next';
import ru from '../locales/ru/translation.js';

import { appProcessStates, formProcessStates, messagesTypes } from './constants.js';
import {
  updateState,
  getProxyFor,
  isDuplicateFeed,
  normalizeFeed,
  normalizePosts,
} from './utils.js';

import initView from './initView.js';
import initModal from './initModal.js';

import parseRSS from './rssParser.js';

const validate = (value) => {
  const scheme = yup.string().trim().required().url();
  return scheme.validate(value);
};

const loadRssFeed = (url) => axios(getProxyFor(url))
  .then((response) => {
    const { contents } = response.data;
    return contents;
  })
  .catch(() => {
    throw new Error(messagesTypes.networkError);
  });

const loadNewPosts = (feeds) => {
  const requests = feeds.map(({ url }) => loadRssFeed(url));
  return Promise.all(requests)
    .then((rssFeeds) => rssFeeds.flatMap((rssFeed, index) => {
      const currentFeed = feeds[index];
      const [, posts] = parseRSS(rssFeed);

      return normalizePosts(posts, currentFeed.id);
    }));
};

const listenToNewPosts = (watchedState) => {
  const timeoutMs = 5000;

  if (watchedState.feeds.length === 0) {
    setTimeout(listenToNewPosts, timeoutMs, watchedState);
    return;
  }

  loadNewPosts(watchedState.feeds)
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
      setTimeout(listenToNewPosts, timeoutMs, watchedState);
    });
};

export default () => {
  const state = {
    feeds: [],
    posts: [],
    lastTimePostsUpdate: 0,
    processState: appProcessStates.online,
    messageType: null,
    form: {
      valid: true,
      processState: formProcessStates.filling,
      messageType: null,
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
  const postPreviewModal = initModal(elements.postPreviewModal, i18nextInstance);

  yup.setLocale({
    mixed: {
      required: messagesTypes.form.requiredField,
    },
    string: {
      url: messagesTypes.form.invalidURL,
    },
  });

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

    updateState(watched, {
      processState: appProcessStates.online,
      messageType: null,
    });

    updateState(watched.form, {
      processState: formProcessStates.sending,
    });

    validate(rssUrl)
      .then((url) => {
        if (isDuplicateFeed(watched.feeds, url)) {
          throw new Error(messagesTypes.form.duplicateRSS);
        }

        updateState(watched.form, {
          valid: true,
          messageType: null,
        });

        return loadRssFeed(url);
      })
      .then((data) => {
        const [feed, posts] = parseRSS(data);

        const normalizedFeed = normalizeFeed(feed, { url: rssUrl });
        const normalizedPosts = normalizePosts(posts, { feedId: normalizedFeed.id });

        updateState(watched, {
          feeds: [normalizedFeed, ...watched.feeds],
          posts: [...normalizedPosts, ...watched.posts],
          lastTimePostsUpdate: Date.now(),
        });

        updateState(watched.form, {
          messageType: messagesTypes.form.addRSS,
          processState: formProcessStates.finished,
        });
      })
      .catch((error) => {
        const { message } = error;

        switch (message) {
          case messagesTypes[message]:
            updateState(watched.form, {
              processState: formProcessStates.filling,
            });

            updateState(watched, {
              messageType: messagesTypes[message],
              processState: appProcessStates.offline,
            });
            break;

          case messagesTypes.form[message]:
            updateState(watched.form, {
              valid: false,
              messageType: messagesTypes.form[message],
              processState: formProcessStates.failed,
            });
            break;

          default:
            throw new Error(`Unexpected type error: ${message}`);
        }
      });
  });

  listenToNewPosts(watched);
};
