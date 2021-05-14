import formProcessStates from '../constants.js';

export const render = (state) => {
  const feedsContainer = document.querySelector('.feeds');
  const postsContainer = document.querySelector('.posts');
  feedsContainer.innerHTML = '';
  postsContainer.innerHTML = '';

  const feedsList = document.createElement('ul');
  feedsList.classList.add('list-group');
  state.channels.forEach((channel) => {
    const {
      title: channelTitle,
      description: channelDescription,
    } = channel;

    const listItem = document.createElement('li');
    listItem.classList.add('list-group-item');

    const channelTitleElement = document.createElement('h3');
    channelTitleElement.textContent = channelTitle;
    channelTitleElement.classList.add('h3');

    const feedDescriptionElement = document.createElement('p');
    feedDescriptionElement.classList.add('mb-0');
    feedDescriptionElement.textContent = channelDescription;

    listItem.append(channelTitleElement, feedDescriptionElement);
    feedsList.append(listItem);
  });

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
    button.textContent = 'Просмотр';

    listItem.append(postLinkElement, button);
    postsList.append(listItem);
  });

  feedsContainer.append(feedsList);
  postsContainer.append(postsList);
};

export const renderError = (state) => {
  console.log('renderError');
  const errorMessageContainer = document.querySelector('.error-messages');
  if (state.onlineState.isOnline) {
    errorMessageContainer.classList.remove('bg-danger');
    errorMessageContainer.classList.add('bg-success');
  } else {
    errorMessageContainer.classList.remove('bg-success');
    errorMessageContainer.classList.add('bg-danger');
  }
  errorMessageContainer.textContent = state.onlineState.message;
};

export const renderForm = (state, formElements) => {
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
