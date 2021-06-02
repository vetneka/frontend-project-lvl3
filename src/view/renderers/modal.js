export default (state, modalElements, i18nextInstance) => {
  const {
    title,
    body,
    closeButton,
    readMoreLink,
  } = modalElements;

  const currentPost = state.posts.find((post) => post.id === state.currentPreviewPostId);

  title.textContent = currentPost.title;
  body.textContent = currentPost.description;
  closeButton.textContent = i18nextInstance.t('buttons.modal.close');
  readMoreLink.textContent = i18nextInstance.t('buttons.modal.readMore');
  readMoreLink.href = currentPost.link;
};
