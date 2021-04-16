import * as yup from 'yup';
import onChange from 'on-change';

const scheme = yup.string().url().required();

const isValidFeed = (data) => data.querySelector('parsererror') === null;

export default () => {
  const state = {
    feedURLs: new Set(),
    form: {
      state: 'filling', // filling, sending, finished, failed
      messages: {
        success: [],
        errors: [],
      },
      valid: true,
    },
  };

  const watchedState = onChange(state, function (path, value) {
    const errorContainer = document.querySelector('.feedback');
    const input = document.querySelector('[name="add-rss"]');
    const submitButton = document.querySelector('button[type="submit"]');

    switch (path) {
      case 'form.state': {
        if (value === 'sending') {
          submitButton.disabled = true;
        }
        if (value === 'finished') {
          submitButton.disabled = false;

          const successMessage = this.form.messages.success.pop();
          errorContainer.textContent = successMessage;
          errorContainer.classList.remove('text-danger');
          errorContainer.classList.add('text-success');
        }
        if (value === 'failed') {
          submitButton.disabled = false;

          const errorMessage = this.form.messages.errors.pop();
          errorContainer.textContent = errorMessage;
          errorContainer.classList.remove('text-success');
          errorContainer.classList.add('text-danger');
        }
        if (value === 'filling') {
          errorContainer.innerHTML = '';
          submitButton.disabled = false;
        }
        break;
      }
      case 'form.valid': {
        if (value) {
          input.classList.remove('is-invalid');
        } else {
          input.classList.add('is-invalid');
        }
        break;
      }
      default:
        break;
    }
  });

  const addFeedForm = document.querySelector('.feed-form');

  addFeedForm.addEventListener('submit', (event) => {
    event.preventDefault();

    watchedState.form.state = 'sending';

    const formData = new FormData(event.target);
    const inputValue = formData.get('add-rss');

    if (watchedState.feedURLs.has(inputValue)) {
      console.log('RSS уже существует');
      watchedState.form.messages.errors.push('RSS уже существует');
      watchedState.form.valid = false;
      watchedState.form.state = 'failed';
      return;
    }

    const isValidURL = scheme.isValidSync(inputValue);
    console.log('isValidURL', isValidURL);

    if (!isValidURL) {
      console.log('invalid url', isValidURL);
      watchedState.form.messages.errors.push('Ссылка должна быть валидным URL');
      watchedState.form.valid = false;
      watchedState.form.state = 'failed';
      return;
    }

    watchedState.form.valid = true;

    fetch(`https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(inputValue)}`)
      .then((responce) => {
        console.log(responce);
        return responce.json();
      })
      .then((data) => {
        const parser = new DOMParser();
        const dom = parser.parseFromString(data.contents, 'application/xml');

        if (!isValidFeed(dom)) {
          console.log('не валидный RSS');
          watchedState.form.messages.errors.push('Ресурс не содержит валидный RSS');
          watchedState.form.state = 'failed';
          return;
        }
        watchedState.feedURLs.add(inputValue);
        watchedState.form.messages.success.push('RSS успешно добавлен');
        watchedState.form.state = 'finished';

        setTimeout(() => {
          watchedState.form.state = 'filling';
        }, 2000);

        console.log(dom);
        console.log(state);
      })
      .catch((error) => {
        console.log('ошибка сети', error);
        watchedState.form.messages.errors.push('Ошибка сети');
        watchedState.form.state = 'failed';
      });
  });
};
