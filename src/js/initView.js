import onChange from 'on-change';
import render from './renderers/index.js';

export default (state, elements, i18nextInstance) => {
  const { feedForm } = elements;

  const watchedState = onChange(state, (path) => {
    if (path.startsWith('form')) {
      render.form(watchedState, feedForm, i18nextInstance);
    }

    if (path === 'channels') {
      render.feeds(watchedState);
    }

    if (path === 'posts') {
      render.posts(watchedState, i18nextInstance);
    }

    if (path === 'uiState.viewedPostsIds') {
      render.posts(watchedState, i18nextInstance);
    }
  });

  render.feeds(watchedState);
  render.posts(watchedState, i18nextInstance);

  return watchedState;
};
