/* eslint no-param-reassign: ["error", { "props": false }] */

import 'bootstrap/js/dist/modal';
import * as yup from 'yup';
import axios from 'axios';
import { uniqueId, differenceWith } from 'lodash';

import i18next from 'i18next';
import resources from './locales/index.js';

import { processStates, errors } from './constants.js';

import rssParser from './rssParser.js';
import validate from './validate.js';

import initView from './initView.js';

const getProxyUrl = (url) => (
  `https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(url)}&disableCache=true`
);

const normalizeFeed = (feed, options = {}) => ({
  ...feed,
  id: uniqueId(),
  ...options,
});

const normalizePosts = (posts, options = {}) => posts.map((post) => ({
  ...post,
  id: uniqueId(),
  ...options,
}));

const loadRssFeed = (url) => axios.get(getProxyUrl(url))
  .then((response) => rssParser(response.data.contents))
  .catch((error) => { throw error; });

const loadNewPosts = (feeds) => {
  const requests = feeds.map(({ url }) => loadRssFeed(url));
  return Promise.all(requests)
    .then((responses) => responses.flatMap(([, posts], index) => {
      const currentFeed = feeds[index];

      return normalizePosts(posts, { feedId: currentFeed.id });
    }));
};

const listenToNewPosts = (watchedState) => {
  const timeoutMs = 5000;

  loadNewPosts(watchedState.feeds)
    .then((newPosts) => {
      const newUniquePosts = differenceWith(
        newPosts,
        watchedState.posts,
        (newPost, oldPost) => newPost.pubDate <= oldPost.pubDate,
      );

      if (!newUniquePosts.length) {
        return;
      }

      watchedState.posts = [...newUniquePosts, ...watchedState.posts];
    })
    .finally(() => {
      setTimeout(listenToNewPosts, timeoutMs, watchedState);
    });
};

const errorHandler = (error, watchedState) => {
  const errorMessage = (error.isAxiosError)
    ? errors.app.network
    : error.message;

  switch (errorMessage) {
    case errors.app.network:
      watchedState.processStateError = errors.app.network;
      break;

    case errors.app.rssParser:
      watchedState.processStateError = errors.app.rssParser;
      break;

    default:
      watchedState.processStateError = errors.app.unknown;
      console.error(`Unknown error type: ${error.message}.`);
  }

  watchedState.processState = processStates.failed;
  watchedState.form.processState = processStates.initial;
};

const fetchRss = (url, watchedState) => loadRssFeed(url)
  .then(([feed, posts]) => {
    const normalizedFeed = normalizeFeed(feed, { url });
    const normalizedPosts = normalizePosts(posts, { feedId: normalizedFeed.id });

    watchedState.processStateError = null;
    watchedState.processState = processStates.finished;
    watchedState.feeds = [normalizedFeed, ...watchedState.feeds];
    watchedState.posts = [...normalizedPosts, ...watchedState.posts];
    watchedState.form.processState = processStates.finished;
  })
  .catch((error) => {
    errorHandler(error, watchedState);
  });

export default () => {
  const defaultLanguage = 'ru';

  const state = {
    feeds: [],
    posts: [],
    processStateError: null,
    processState: processStates.initial,
    form: {
      valid: true,
      processStateError: null,
      processState: processStates.initial,
    },
    uiState: {
      viewedPostsIds: new Set(),
      previewPostId: null,
    },
  };

  const elements = {
    feedForm: {
      form: document.querySelector('.feed-form'),
      input: document.querySelector('[name="add-rss"]'),
      submitButton: document.querySelector('button[type="submit"]'),
    },

    messageContainer: document.querySelector('.message-container'),
    feedsContainer: document.querySelector('.feeds'),
    postsContainer: document.querySelector('.posts'),

    postPreviewModal: {
      title: document.querySelector('#postPreviewModal .modal-title'),
      body: document.querySelector('#postPreviewModal .modal-body'),
      closeButton: document.querySelector('#postPreviewModal .modal-footer [data-bs-dismiss]'),
      readMoreLink: document.querySelector('#postPreviewModal .modal-footer [data-readmore]'),
    },
  };

  const i18nextInstance = i18next.createInstance();

  yup.setLocale(resources.yup);

  return i18nextInstance.init({
    lng: defaultLanguage,
    resources: { ru: resources.ru },
  }).then(() => {
    const watchedState = initView(state, elements, i18nextInstance);

    elements.postsContainer.addEventListener('click', (event) => {
      const previewPostId = event.target.dataset.postId;

      if (!previewPostId) {
        return;
      }

      event.preventDefault();

      watchedState.uiState.previewPostId = previewPostId;
      watchedState.uiState.viewedPostsIds = watchedState.uiState.viewedPostsIds.add(previewPostId);
    });

    elements.feedForm.form.addEventListener('submit', (event) => {
      event.preventDefault();

      const formData = new FormData(event.target);
      const rssUrl = formData.get('add-rss');

      watchedState.processStateError = null;
      watchedState.processState = processStates.initial;
      watchedState.form.valid = true;
      watchedState.form.processStateError = null;
      watchedState.form.processState = processStates.sending;

      const validateError = validate(watchedState.feeds, rssUrl);

      if (validateError) {
        watchedState.form.valid = false;
        watchedState.form.processStateError = validateError.message;
        watchedState.form.processState = processStates.failed;
        return;
      }

      fetchRss(rssUrl, watchedState);
    });

    listenToNewPosts(watchedState);
  });
};
