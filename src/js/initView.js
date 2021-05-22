import onChange from 'on-change';
import render from './renderers/index.js';

export default (state, elements, i18nextInstance) => {
  const { feedForm } = elements;

  const renderMapping = {
    processState: () => render.appError(
      state.messageType,
      feedForm,
      i18nextInstance,
    ),
    channels: () => render.feeds(state),
    posts: () => render.posts(state, i18nextInstance),
    'form.processState': () => render.form(state, feedForm, i18nextInstance),
    'uiState.viewedPostsIds': () => render.posts(state, i18nextInstance),
  };

  const watchedState = onChange(state, (path) => {
    if (renderMapping[path]) {
      renderMapping[path]();
    }
  });

  render.feeds(watchedState);
  render.posts(watchedState, i18nextInstance);

  return watchedState;
};
