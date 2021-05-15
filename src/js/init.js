/* eslint no-param-reassign: ["error", { "props": false }] */

import * as yup from 'yup';
import onChange from 'on-change';
import { uniqueId, differenceBy } from 'lodash';
import axios from 'axios';
import i18next from 'i18next';
import ru from '../locales/ru/translation.js';
import { formProcessStates, messagesTypes } from './constants.js';
import parseRSS from './rssParser.js';
import {
  render,
  renderError,
  renderForm,
} from './renderers/index.js';

const scheme = yup.string().url().required();

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
  const i18nextInstance = i18next.createInstance();
  i18nextInstance.init({
    lng: 'ru',
    resources: {
      ru,
    },
  });

  const state = {
    channels: [],
    posts: [],
    lastTimePostsUpdate: 0,
    form: {
      valid: true,
      processState: formProcessStates.filling,
      messageType: messagesTypes.empty,
    },
    onlineState: {
      message: '',
      isOnline: true,
    },
    activeModal: {
      id: '',
      overlayChecker: false,
      isOpened: false,
      content: {
        title: '',
        description: '',
        link: '',
      },
    },
    uiState: {
      viewedPostsIds: new Set(),
    },
  };

  const openModal = (modal) => {
    const { id, content: { title, description, link } } = modal;
    const modalElement = document.querySelector(id);
    const modalTitleElement = modalElement.querySelector('.modal-title');
    const modalDescriptionElement = modalElement.querySelector('.modal-body');
    const modalReadMoreButton = modalElement.querySelector('.full-article');

    modalElement.style.display = 'block';
    modalElement.style.paddingRight = '15px';

    modalTitleElement.textContent = title;
    modalDescriptionElement.textContent = description;
    modalReadMoreButton.href = link;

    document.body.classList.add('modal-open');
    document.body.style.paddingRight = '15px';

    const modalBackdrop = document.createElement('div');
    modalBackdrop.classList.add('modal-backdrop', 'fade');

    document.body.append(modalBackdrop);

    setTimeout(() => {
      modalElement.classList.add('show');
      modalBackdrop.classList.add('show');
    }, 300);
  };

  const closeModal = (modal) => {
    const { id } = modal;
    const modalElement = document.querySelector(id);

    modalElement.classList.remove('show');
    modalElement.style.paddingRight = '';

    document.body.classList.remove('modal-open');
    document.body.style.paddingRight = '';

    const modalBackdrop = document.querySelector('.modal-backdrop');
    modalBackdrop.classList.remove('show');

    setTimeout(() => {
      modalElement.style.display = 'none';
      modalBackdrop.remove();
    }, 300);
  };

  const formElements = {
    form: document.querySelector('.feed-form'),
    input: document.querySelector('[name="add-rss"]'),
    submitButton: document.querySelector('button[type="submit"]'),
    messageContainer: document.querySelector('.message-container'),
  };

  const watchedState = onChange(state, (path, value) => {
    if (path.startsWith('form')) {
      renderForm(watchedState, formElements, i18nextInstance);
    }

    if (path === 'posts') {
      render(watchedState);
    }

    if (path === 'channels') {
      render(watchedState);
    }

    if (path.startsWith('onlineState')) {
      renderError(watchedState);
    }

    if (path === 'activeModal.isOpened') {
      if (value) {
        openModal(watchedState.activeModal);
      } else {
        closeModal(watchedState.activeModal);
      }
    }

    if (path === 'uiState.viewedPostsIds') {
      render(watchedState);
    }
  });

  const postsContainer = document.querySelector('.posts');
  const postPreviewModal = document.querySelector('#postPreviewModal');

  postsContainer.addEventListener('click', (event) => {
    const button = event.target;
    if (button.dataset.toggle !== 'modal') {
      return;
    }
    event.preventDefault();

    const currentModalId = button.dataset.target;
    const currentPostId = button.dataset.postId;
    const {
      id,
      title,
      description,
      link,
    } = watchedState.posts.find((post) => post.id === currentPostId);

    updateState(watchedState.activeModal.content, {
      title,
      description,
      link,
    });

    updateState(watchedState.uiState, {
      viewedPostsIds: watchedState.uiState.viewedPostsIds.add(id),
    });

    updateState(watchedState.activeModal, {
      id: currentModalId,
      isOpened: true,
    });
  });

  postPreviewModal.addEventListener('mousedown', (event) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    watchedState.activeModal.overlayChecker = true;
  });

  postPreviewModal.addEventListener('mouseup', (event) => {
    if (watchedState.activeModal.overlayChecker && event.target === event.currentTarget) {
      updateState(watchedState.activeModal, {
        isOpened: false,
      });
    }
    watchedState.activeModal.overlayChecker = false;
  });

  postPreviewModal.addEventListener('click', (event) => {
    if (!event.target.closest('[data-dismiss="modal"]')) {
      return;
    }
    event.preventDefault();
    updateState(watchedState.activeModal, {
      isOpened: false,
    });
  });

  document.addEventListener('keyup', (event) => {
    if (event.code !== 'Escape') {
      return;
    }
    updateState(watchedState.activeModal, {
      isOpened: false,
    });
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
        messageType: messagesTypes.duplicateRSS,
      });
      return;
    }

    if (!isValidURL(rssUrl)) {
      updateState(watchedState.form, {
        valid: false,
        processState: formProcessStates.failed,
        messageType: messagesTypes.invalidURL,
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
          messageType: messagesTypes.addRSS,
        });
      })
      .catch((error) => {
        const errorType = error.message;

        switch (errorType) {
          case messagesTypes.invalidRSS: {
            updateState(watchedState.form, {
              messageType: messagesTypes.invalidRSS,
            });
            break;
          }
          case messagesTypes.network: {
            updateState(watchedState.form, {
              messageType: messagesTypes.network,
            });
            break;
          }
          default:
            break;
        }

        updateState(watchedState.form, {
          processState: formProcessStates.failed,
        });
      });
  });

  render(watchedState);
  listenToNewPosts(watchedState);
};
