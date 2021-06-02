import * as yup from 'yup';
import { differenceWith } from 'lodash';
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
  const state = {
    feeds: [],
    posts: [],
    currentPreviewPostId: null,
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

    postPreviewModal: {
      title: document.querySelector('#postPreviewModal .modal-title'),
      body: document.querySelector('#postPreviewModal .modal-body'),
      closeButton: document.querySelector('#postPreviewModal .modal-footer [data-bs-dismiss]'),
      readMoreLink: document.querySelector('#postPreviewModal .modal-footer [data-readmore]'),
    },
  };

  const i18nextInstance = i18next.createInstance();

  i18nextInstance.init({
    lng: 'ru',
    resources: {
      ru: resources.ru,
    },
  });

  const watched = initView(state, elements, i18nextInstance);
  updateState.state = watched;

  yup.setLocale({
    mixed: {
      required: messagesTypes.form.requiredField,
    },
    string: {
      url: messagesTypes.form.invalidURL,
    },
  });

  elements.postsContainer.addEventListener('click', (event) => {
    const currentPostId = event.target.dataset.postId;

    if (!currentPostId) {
      return;
    }

    event.preventDefault();

    updateState({
      currentPreviewPostId: currentPostId,
      uiState: {
        viewedPostsIds: watched.uiState.viewedPostsIds.add(currentPostId),
      },
    });
  });

  elements.feedForm.form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const rssUrl = formData.get('add-rss');

    updateState({
      messageType: null,
      processState: appProcessStates.online,
      form: {
        messageType: null,
        valid: true,
        processState: formProcessStates.sending,
      },
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

        updateState({
          feeds: [normalizedFeed, ...watched.feeds],
          posts: [...normalizedPosts, ...watched.posts],
          form: {
            messageType: messagesTypes.form.addRSS,
            processState: formProcessStates.finished,
          },
        });
      })
      .catch((error) => {
        const { message } = error;

        switch (message) {
          case messagesTypes[message]:
            updateState({
              form: {
                processState: formProcessStates.filling,
              },
              messageType: messagesTypes[message],
              processState: appProcessStates.offline,
            });
            break;

          case messagesTypes.form[message]:
            updateState({
              form: {
                valid: false,
                messageType: messagesTypes.form[message],
                processState: formProcessStates.failed,
              },
            });
            break;

          default:
            throw new Error(`Unexpected type error: ${message}`);
        }
      });
  });

  innerListenToNewPosts(watched);
};
