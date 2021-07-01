/* eslint no-param-reassign: ["error", { "props": false }] */

import 'bootstrap/js/dist/modal';
import * as yup from 'yup';
import axios from 'axios';
import { uniqueId, differenceWith, isEmpty } from 'lodash';

import i18next from 'i18next';
import resources from './locales/index.js';

import processStates from './constants.js';

import rssParser from './rssParser.js';
import validate from './validate.js';

import initView from './initView.js';

const getProxyUrl = (url) => {
  const baseUrl = 'https://hexlet-allorigins.herokuapp.com/get';

  const proxyUrl = new URL(baseUrl);
  proxyUrl.searchParams.set('disableCache', 'true');
  proxyUrl.searchParams.set('url', url);

  return proxyUrl.toString();
};

const normalizeFeed = (feed) => ({
  ...feed,
  id: uniqueId(),
});

const normalizePosts = (posts, options = {}) => posts.map((post) => ({
  ...post,
  id: uniqueId(),
  ...options,
}));

const loadRssFeed = (url) => axios.get(getProxyUrl(url))
  .then((response) => rssParser(response.data.contents));

const loadNewPosts = (watchedState) => {
  const requests = watchedState.rssUrls.map((url) => loadRssFeed(url));
  return Promise.all(requests)
    .then((responses) => responses.flatMap(({ items }, index) => {
      const currentFeed = watchedState.feeds[index];

      return normalizePosts(items, { feedId: currentFeed.id });
    }));
};

const listenToNewPosts = (watchedState) => {
  const timeoutMs = 5000;

  loadNewPosts(watchedState)
    .then((newPosts) => {
      const newUniquePosts = differenceWith(
        newPosts,
        watchedState.posts,
        (newPost, oldPost) => newPost.title === oldPost.title,
      );

      if (isEmpty(newUniquePosts)) {
        return;
      }

      watchedState.posts = [...newUniquePosts, ...watchedState.posts];
    })
    .finally(() => {
      setTimeout(listenToNewPosts, timeoutMs, watchedState);
    });
};

const fetchRss = (url, watchedState) => loadRssFeed(url)
  .then(({ title, description, items }) => {
    const normalizedFeed = normalizeFeed({ title, description });
    const normalizedPosts = normalizePosts(items, { feedId: normalizedFeed.id });

    watchedState.processStateError = null;
    watchedState.processState = processStates.finished;
    watchedState.rssUrls = [url, ...watchedState.rssUrls];
    watchedState.feeds = [normalizedFeed, ...watchedState.feeds];
    watchedState.posts = [...normalizedPosts, ...watchedState.posts];
    watchedState.form.processState = processStates.finished;
  })
  .catch((error) => {
    if (error.isAxiosError) {
      watchedState.processStateError = 'errors.app.network';
    } else if (error.isParseError) {
      watchedState.processStateError = 'errors.app.rssParser';
    } else {
      watchedState.processStateError = 'errors.app.unknown';
      console.error(`Unknown error type: ${error.message}.`);
    }

    watchedState.processState = processStates.failed;
    watchedState.form.processState = processStates.initial;
  });

export default () => {
  const defaultLanguage = 'ru';

  const state = {
    rssUrls: [],
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

      const validateError = validate(rssUrl, watchedState.rssUrls);

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
