import * as yup from 'yup';
import { differenceWith } from 'lodash';
import axios from 'axios';
import 'bootstrap/js/dist/modal';

import i18next from 'i18next';
import resources from './locales/index.js';

import {
  processStates,
  errors,
} from './constants.js';

import {
  updateState,
  getProxyFor,
  isDuplicateFeed,
  normalizeFeed,
  normalizePosts,
} from './utils.js';

import initView from './view/initView.js';
import parseRSS from './rssParser.js';

const validate = (feeds, value) => {
  const scheme = yup.string().trim().required().url();

  try {
    scheme.validateSync(value);

    if (isDuplicateFeed(feeds, value)) {
      throw new Error(errors.form.duplicateRSS);
    }

    return null;
  } catch (error) {
    return error;
  }
};

const loadRssFeed = (url) => axios(getProxyFor(url))
  .then((response) => {
    const { contents } = response.data;
    return contents;
  })
  .catch(() => {
    throw new Error(errors.app.network);
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
      const newUniquePosts = differenceWith(
        newPosts,
        watchedState.posts,
        (newPost, oldPost) => newPost.pubDate <= oldPost.pubDate,
      );

      updateState({
        posts: [...newUniquePosts, ...watchedState.posts],
      });
    })
    .finally(() => {
      setTimeout(listenToNewPosts, timeoutMs, watchedState);
    });
};

export default (innerListenToNewPosts = listenToNewPosts) => {
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
    resources: {
      ru: resources.ru,
    },
  }).then(() => {
    const watched = initView(state, elements, i18nextInstance);
    updateState.state = watched;

    elements.postsContainer.addEventListener('click', (event) => {
      const previewPostId = event.target.dataset.postId;

      if (!previewPostId) {
        return;
      }

      event.preventDefault();

      updateState({
        uiState: {
          previewPostId,
          viewedPostsIds: watched.uiState.viewedPostsIds.add(previewPostId),
        },
      });
    });

    elements.feedForm.form.addEventListener('submit', (event) => {
      event.preventDefault();

      const formData = new FormData(event.target);
      const rssUrl = formData.get('add-rss');

      updateState({
        processStateError: null,
        processState: processStates.initial,
        form: {
          valid: true,
          processStateError: null,
          processState: processStates.sending,
        },
      });

      const validateError = validate(watched.feeds, rssUrl);

      if (validateError) {
        updateState({
          form: {
            valid: false,
            processStateError: validateError.message,
            processState: processStates.failed,
          },
        });
        return;
      }

      loadRssFeed(rssUrl)
        .then((data) => {
          const [feed, posts] = parseRSS(data);

          const normalizedFeed = normalizeFeed(feed, { url: rssUrl });
          const normalizedPosts = normalizePosts(posts, { feedId: normalizedFeed.id });

          updateState({
            processStateError: null,
            processState: processStates.finished,
            feeds: [normalizedFeed, ...watched.feeds],
            posts: [...normalizedPosts, ...watched.posts],
            form: {
              processState: processStates.finished,
            },
          });
        })
        .catch((error) => {
          switch (error.message) {
            case errors.app.network:
              updateState({
                processStateError: errors.app.network,
              });
              break;

            case errors.app.invalidRSS:
              updateState({
                processStateError: errors.app.invalidRSS,
              });
              break;

            default:
              throw new Error(`Unexpected type error: ${error.message}`);
          }

          updateState({
            processState: processStates.failed,
            form: {
              processState: processStates.initial,
            },
          });
        });
    });

    innerListenToNewPosts(watched);
  });
};
