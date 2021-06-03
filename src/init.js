import * as yup from 'yup';
import 'bootstrap/js/dist/modal';

import i18next from 'i18next';
import resources from './locales/index.js';

import { processStates, errors } from './constants.js';
import updateState from './utils.js';

import {
  rssParser,
  validate,
  normalizeFeed,
  normalizePosts,
} from './rss/index.js';

import {
  loadRssFeed,
  listenToNewPosts,
} from './api.js';

import initView from './view/initView.js';

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
          const [feed, posts] = rssParser(data);

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
