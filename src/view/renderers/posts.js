/* eslint no-param-reassign: ["error", { "props": false }] */

export default (state, container, i18nextInstance) => {
  container.innerHTML = '';

  if (state.posts.length === 0) {
    return;
  }

  const header = document.createElement('h2');
  header.textContent = i18nextInstance.t('headlines.posts');

  const postsList = document.createElement('ul');
  postsList.classList.add('list-group');

  const postsListItems = state.posts.map((post) => {
    const item = document.createElement('li');
    item.classList.add(
      'd-flex',
      'list-group-item',
      'justify-content-between',
      'align-items-start',
    );

    const link = document.createElement('a');
    const linkFontWeights = (state.uiState.viewedPostsIds.has(post.id))
      ? ['fw-normal', 'font-weight-normal']
      : ['fw-bold', 'font-weight-bold'];

    link.classList.add(...linkFontWeights);
    link.href = post.link;
    link.textContent = post.title;

    const button = document.createElement('button');
    button.classList.add('btn', 'btn-primary', 'btn-sm', 'ms-2');
    button.type = 'button';
    button.dataset.bsToggle = 'modal';
    button.dataset.bsTarget = '#postPreviewModal';
    button.dataset.postId = post.id;
    button.textContent = i18nextInstance.t('buttons.postPreview');

    item.append(link, button);

    return item;
  });

  postsList.append(...postsListItems);
  container.append(header, postsList);
};
