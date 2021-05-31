export default (state, modal, i18nextInstance) => {
  const elements = {
    title: modal.querySelector('.modal-title'),
    body: modal.querySelector('.modal-body'),
    closeButton: modal.querySelector('.modal-footer [data-bs-dismiss]'),
    readMoreLink: modal.querySelector('.modal-footer [data-readmore]'),
  };

  const currentPost = state.posts.find((post) => post.id === state.currentPreviewPostId);
  const {
    title,
    description,
    link,
  } = currentPost;

  elements.title.textContent = title;
  elements.body.textContent = description;
  elements.closeButton.textContent = i18nextInstance.t('buttons.modal.close');
  elements.readMoreLink.textContent = i18nextInstance.t('buttons.modal.readMore');
  elements.readMoreLink.href = link;
};
