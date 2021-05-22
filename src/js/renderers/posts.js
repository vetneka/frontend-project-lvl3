export default (state, i18nextInstance) => {
  const postsContainer = document.querySelector('.posts');
  postsContainer.innerHTML = '';

  if (state.posts.length === 0) {
    return;
  }

  const header = document.createElement('h2');
  header.textContent = i18nextInstance.t('headlines.posts');

  const postsList = document.createElement('ul');
  postsList.classList.add('list-group');

  state.posts.forEach((post) => {
    const {
      title: postTitle,
      link: postLink,
      id: postId,
    } = post;

    const listItem = document.createElement('li');
    listItem.classList.add(
      'd-flex',
      'list-group-item',
      'justify-content-between',
      'align-items-start',
    );

    const postLinkElement = document.createElement('a');
    postLinkElement.textContent = postTitle;
    postLinkElement.href = postLink;

    const linkFontWeight = (state.uiState.viewedPostsIds.has(postId))
      ? 'font-weight-normal'
      : 'font-weight-bold';

    postLinkElement.classList.add(linkFontWeight);

    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.toggle = 'modal';
    button.dataset.target = '#postPreviewModal';
    button.dataset.postId = postId;
    button.classList.add('btn', 'btn-primary', 'btn-sm', 'ml-2');
    button.textContent = i18nextInstance.t('buttons.postPreview');

    listItem.append(postLinkElement, button);
    postsList.append(listItem);
  });

  postsContainer.append(header, postsList);
};
