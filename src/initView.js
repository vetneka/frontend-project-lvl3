import onChange from 'on-change';
import render from './view/index.js';

export default (state, elements, i18nextInstance) => {
  const {
    feedForm,
    postPreviewModal,
  } = elements;

  const renderMapping = {
    processState: () => render.feedback(state, elements, i18nextInstance),
    feeds: () => render.feeds(state, elements, i18nextInstance),
    posts: () => render.posts(state, elements, i18nextInstance),
    'form.processState': () => {
      render.form(state, feedForm, i18nextInstance);
      render.feedback(state, elements, i18nextInstance);
    },
    'uiState.viewedPostsIds': () => render.posts(state, elements, i18nextInstance),
    'uiState.previewPostId': () => render.modal(state, postPreviewModal, i18nextInstance),
  };

  const watchedState = onChange(state, (path) => {
    renderMapping[path]?.();
  });

  return watchedState;
};
