import * as yup from 'yup';
import { differenceBy } from 'lodash';
import axios from 'axios';
import 'bootstrap/js/dist/modal';

import i18next from 'i18next';
import resources from './locales/index.js';

import { appProcessStates, formProcessStates, messagesTypes } from './constants.js';
import {
  updateState,
  getProxyFor,
  isDuplicateFeed,
  normalizeFeed,
  normalizePosts,
} from './utils.js';

import initView from './view/initView.js';

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

export default (innerListenToNewPosts = listenToNewPosts) => {
  const state = {
    feeds: [],
    posts: [],
    currentPreviewPostId: null,
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

    feedsContainer: document.querySelector('.feeds'),
    postsContainer: document.querySelector('.posts'),

    postPreviewModal: document.querySelector('#postPreviewModal'),
  };

  const i18nextInstance = i18next.createInstance();

  i18nextInstance.init({
    lng: 'ru',
    resources: {
      ru: resources.ru,
    },
  });

  const watched = initView(state, elements, i18nextInstance);

  yup.setLocale({
    mixed: {
      required: messagesTypes.form.requiredField,
    },
    string: {
      url: messagesTypes.form.invalidURL,
    },
  });

  elements.postsContainer.addEventListener('click', (event) => {
    const button = event.target;

    if (button.dataset.bsToggle !== 'modal') {
      return;
    }

    event.preventDefault();

    const currentPostId = button.dataset.postId;

    updateState(watched, {
      currentPreviewPostId: currentPostId,
    });

    updateState(watched.uiState, {
      viewedPostsIds: watched.uiState.viewedPostsIds.add(currentPostId),
    });
  });

  elements.feedForm.form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const rssUrl = formData.get('add-rss');

    updateState(watched, {
      messageType: null,
      processState: appProcessStates.online,
    });

    updateState(watched.form, {
      messageType: null,
      valid: true,
      processState: formProcessStates.sending,
    });

    validate(rssUrl)
      .then((url) => {
        if (isDuplicateFeed(watched.feeds, url)) {
          throw new Error(messagesTypes.form.duplicateRSS);
        }

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

  innerListenToNewPosts(watched);
};
