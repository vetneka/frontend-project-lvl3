import * as yup from 'yup';
import onChange from 'on-change';
import { uniqueId } from 'lodash';
import i18n from './libs/i18n.js';

const formProcessStates = {
  filling: 'filling',
  sending: 'sending',
  failed: 'failed',
  finished: 'finished',
};

const scheme = yup.string().url().required();

const getRSSUrl = (url) => `https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(url)}`;
const isValidURL = (url) => scheme.isValidSync(url);
const isValidFeed = (xmlDOM) => xmlDOM.querySelector('parsererror') === null;
const isDuplicateRSS = (state, url) => state.feeds.find((feed) => feed.url === url) !== undefined;

const parseRSS = (string, url) => {
  const parser = new DOMParser();
  const xmlDOM = parser.parseFromString(string, 'application/xml');

  if (!isValidFeed(xmlDOM)) {
    throw new Error(i18n.t('errorMessages.invalidRSS'));
  }

  const feedId = uniqueId();
  const feedTitle = xmlDOM.querySelector('title');
  const feedDescription = xmlDOM.querySelector('description');

  const feed = {
    feedId,
    url,
    feedTitle: feedTitle.textContent,
    feedDescription: feedDescription.textContent,
  };

  const feedPosts = xmlDOM.querySelectorAll('item');

  const posts = [...feedPosts].map((feedPost) => {
    const feedPostTitle = feedPost.querySelector('title');
    const feedPostLink = feedPost.querySelector('link');

    return {
      id: uniqueId(),
      feedId,
      postTitle: feedPostTitle.textContent,
      postLink: feedPostLink.textContent,
    };
  });

  return [feed, posts];
};

const render = (state) => {
  const feedsContainer = document.querySelector('.feeds');
  const postsContainer = document.querySelector('.posts');
  feedsContainer.innerHTML = '';
  postsContainer.innerHTML = '';

  const feedsList = document.createElement('ul');
  feedsList.classList.add('list-group');
  state.feeds.forEach((feed) => {
    const { feedTitle, feedDescription } = feed;

    const listItem = document.createElement('li');
    listItem.classList.add('list-group-item');

    const feedTitleElement = document.createElement('h3');
    feedTitleElement.textContent = feedTitle;
    feedTitleElement.classList.add('h3');

    const feedDescriptionElement = document.createElement('p');
    feedDescriptionElement.classList.add('mb-0');
    feedDescriptionElement.textContent = feedDescription;

    listItem.append(feedTitleElement, feedDescriptionElement);
    feedsList.append(listItem);
  });

  const postsList = document.createElement('ul');
  postsList.classList.add('list-group');

  state.posts.forEach((post) => {
    const { postTitle, postLink } = post;

    const listItem = document.createElement('li');
    listItem.classList.add('list-group-item');

    const postLinkElement = document.createElement('a');
    postLinkElement.textContent = postTitle;
    postLinkElement.href = postLink;

    listItem.append(postLinkElement);
    postsList.append(listItem);
  });

  feedsContainer.append(feedsList);
  postsContainer.append(postsList);
};

const updateForm = (state, formElements) => {
  const { input, submitButton, messageContainer } = formElements;

  if (state.form.valid) {
    input.classList.remove('is-invalid');
  } else {
    input.classList.add('is-invalid');
  }

  if (state.form.processState === formProcessStates.sending) {
    input.readOnly = true;
    submitButton.disabled = true;
  } else {
    input.readOnly = false;
    submitButton.disabled = false;
  }

  if (state.form.processState === formProcessStates.finished) {
    messageContainer.classList.remove('text-danger');
    messageContainer.classList.add('text-success');
  }

  if (state.form.processState === formProcessStates.failed) {
    messageContainer.classList.remove('text-success');
    messageContainer.classList.add('text-danger');
  }

  messageContainer.textContent = state.form.processMessage;
};

export default () => {
  const state = {
    feeds: [],
    posts: [],
    form: {
      valid: true,
      processState: formProcessStates.filling,
      processMessage: '',
    },
  };

  const formElements = {
    form: document.querySelector('.feed-form'),
    input: document.querySelector('[name="add-rss"]'),
    submitButton: document.querySelector('button[type="submit"]'),
    messageContainer: document.querySelector('.message-container'),
  };

  const watchedState = onChange(state, () => {
    updateForm(state, formElements);
  });

  formElements.form.addEventListener('submit', (event) => {
    event.preventDefault();

    watchedState.form = Object.assign(watchedState.form, {
      processState: formProcessStates.sending,
    });

    const formData = new FormData(event.target);
    const inputValue = formData.get('add-rss');

    if (isDuplicateRSS(watchedState, inputValue)) {
      watchedState.form = Object.assign(watchedState.form, {
        valid: false,
        processState: formProcessStates.failed,
        processMessage: i18n.t('errorMessages.duplicateRSS'),
      });
      return;
    }

    if (!isValidURL(inputValue)) {
      watchedState.form = Object.assign(watchedState.form, {
        valid: false,
        processState: formProcessStates.failed,
        processMessage: i18n.t('errorMessages.invalidURL'),
      });
      return;
    }

    watchedState.form = Object.assign(watchedState.form, {
      valid: true,
    });

    fetch(getRSSUrl(inputValue))
      .then((responce) => responce.json())
      .then((data) => {
        const [feed, posts] = parseRSS(data.contents, inputValue);
        watchedState.feeds = [feed, ...watchedState.feeds];
        watchedState.posts = [...posts, ...watchedState.posts];

        watchedState.form = Object.assign(watchedState.form, {
          processState: formProcessStates.finished,
          processMessage: i18n.t('successMessages.addRSS'),
        });

        render(watchedState);

        setTimeout(() => {
          watchedState.form = Object.assign(watchedState.form, {
            processState: formProcessStates.filling,
            processMessage: '',
          });
        }, 2000);
      })
      .catch((error) => {
        const errorMessage = error.message;

        if (errorMessage === i18n.t('errorMessages.invalidRSS')) {
          watchedState.form = Object.assign(watchedState.form, {
            processMessage: i18n.t('errorMessages.invalidRSS'),
          });
        }

        if (errorMessage === i18n.t('errorMessages.network')) {
          watchedState.form = Object.assign(watchedState.form, {
            processMessage: i18n.t('errorMessages.network'),
          });
        }

        watchedState.form = Object.assign(watchedState.form, {
          processState: formProcessStates.failed,
        });

        throw error;
      });
  });
};
