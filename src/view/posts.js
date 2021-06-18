const createPostItem = (post, viewedPosts, i18nextInstance) => {
  const item = document.createElement('li');
  item.classList.add(
    'd-flex',
    'list-group-item',
    'justify-content-between',
    'align-items-start',
  );

  const link = document.createElement('a');

  // Styles for font-weight are duplicated,
  // because hexlet-check (tests) requires bootstrap 4.6 while application used 5.0
  const linkFontWeights = (viewedPosts.has(post.id))
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
};

export default (state, elements, i18nextInstance) => {
  const { postsContainer } = elements;

  postsContainer.innerHTML = '';

  if (state.posts.length === 0) {
    return;
  }

  const header = document.createElement('h2');
  header.textContent = i18nextInstance.t('headlines.posts');

  const postsList = document.createElement('ul');
  postsList.classList.add('list-group');

  const postItems = state.posts
    .map((post) => createPostItem(post, state.uiState.viewedPostsIds, i18nextInstance));

  postsList.append(...postItems);
  postsContainer.append(header, postsList);
};
