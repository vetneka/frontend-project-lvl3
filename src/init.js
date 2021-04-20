import * as yup from 'yup';
import onChange from 'on-change';

const successMessages = {
  addRSS: 'RSS успешно добавлен',
};

const errorMessages = {
  network: 'Ошибка сети',
  duplicateRSS: 'RSS уже существует',
  invalidRSS: 'Ресурс не содержит валидный RSS',
  invalidURL: 'Ссылка должна быть валидным URL',
};

const formProcessStates = {
  filling: 'filling',
  sending: 'sending',
  failed: 'failed',
  finished: 'finished',
};

const scheme = yup.string().url().required();

const getRSS = (url) => `https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(url)}`;
const isValidURL = (url) => scheme.isValidSync(url);
const isValidFeed = (xmlDOM) => xmlDOM.querySelector('parsererror') === null;
const isDuplicateRSS = (state, url) => state.feeds.find((feed) => feed.url === url) !== undefined;
const parseXML = (string) => {
  const parser = new DOMParser();
  const xmlDOM = parser.parseFromString(string, 'application/xml');
  if (!isValidFeed(xmlDOM)) {
    throw new Error(errorMessages.invalidRSS);
  }

  return xmlDOM;
};

const createPost = (data) => {
  const titleElement = data.querySelector('title');
  const linkElement = data.querySelector('link');

  return {
    title: titleElement.textContent,
    link: linkElement.textContent,
  };
};

const createFeed = (data, url) => {
  const titleElement = data.querySelector('title');
  const descriptionElement = data.querySelector('description');
  const postElements = data.querySelectorAll('item');

  return {
    title: titleElement.textContent,
    description: descriptionElement.textContent,
    url,
    posts: [...postElements].map(createPost),
  };
};

const render = (state) => {
  const feedsContainer = document.querySelector('.feeds');
  const postsContainer = document.querySelector('.posts');
  feedsContainer.innerHTML = '';
  postsContainer.innerHTML = '';

  const feedsList = document.createElement('ul');
  feedsList.classList.add('list-group');
  state.feeds.forEach((feed) => {
    const listItem = document.createElement('li');
    listItem.classList.add('list-group-item');

    const feedTitle = document.createElement('h3');
    feedTitle.textContent = feed.title;
    feedTitle.classList.add('h3');

    const feedDescription = document.createElement('p');
    feedDescription.classList.add('mb-0');
    feedDescription.textContent = feed.description;

    listItem.append(feedTitle, feedDescription);
    feedsList.prepend(listItem);
  });

  const postsList = document.createElement('ul');
  postsList.classList.add('list-group');
  state.feeds.forEach((feed) => {
    const postListFragment = document.createDocumentFragment();
    feed.posts.forEach((post) => {
      const listItem = document.createElement('li');
      listItem.classList.add('list-group-item');

      const postLink = document.createElement('a');
      postLink.textContent = post.title;
      postLink.href = post.link;

      listItem.append(postLink);
      postListFragment.append(listItem);
    });
    postsList.prepend(postListFragment);
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
      processState: 'filling', // filling, sending, finished, failed
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

  const addFeedForm = document.querySelector('.feed-form');

  addFeedForm.addEventListener('submit', (event) => {
    event.preventDefault();

    watchedState.form = Object.assign(watchedState.form, {
      processState: formProcessStates.sending,
    });

    const formData = new FormData(event.target);
    const inputValue = formData.get('add-rss');

    if (isDuplicateRSS(watchedState, inputValue)) {
      watchedState.form = Object.assign(watchedState.form, {
        valid: false,
        processState: 'failed',
        processMessage: errorMessages.duplicateRSS,
      });
      return;
    }

    if (!isValidURL(inputValue)) {
      watchedState.form = Object.assign(watchedState.form, {
        valid: false,
        processState: 'failed',
        processMessage: errorMessages.invalidURL,
      });
      return;
    }

    watchedState.form = Object.assign(watchedState.form, {
      valid: true,
    });

    fetch(getRSS(inputValue))
      .then((responce) => responce.json())
      .then((data) => {
        const xmlDOM = parseXML(data.contents);
        const feed = createFeed(xmlDOM, inputValue);
        watchedState.feeds.push(feed);

        watchedState.form = Object.assign(watchedState.form, {
          processState: 'finished',
          processMessage: successMessages.addRSS,
        });

        render(watchedState);

        setTimeout(() => {
          watchedState.form = Object.assign(watchedState.form, {
            processState: 'filling',
            processMessage: '',
          });
        }, 2000);
      })
      .catch((error) => {
        const errorMessage = error.message;

        if (errorMessage === errorMessages.invalidRSS) {
          watchedState.form = Object.assign(watchedState.form, {
            processMessage: errorMessages.invalidRSS,
          });
        }

        if (errorMessage === errorMessages.network) {
          watchedState.form = Object.assign(watchedState.form, {
            processMessage: errorMessages.network,
          });
        }

        watchedState.form = Object.assign(watchedState.form, {
          processState: 'failed',
        });

        throw error;
      });
  });
};
