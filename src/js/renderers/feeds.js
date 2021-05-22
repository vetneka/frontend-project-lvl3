export default (state, i18nextInstance) => {
  const feedsContainer = document.querySelector('.feeds');
  feedsContainer.innerHTML = '';

  const header = document.createElement('h2');
  header.textContent = i18nextInstance.t('headlines.feeds');

  if (state.feeds.length === 0) {
    const p = document.createElement('p');
    p.textContent = i18nextInstance.t('noFeeds');
    feedsContainer.append(header, p);
    return;
  }

  const feedsList = document.createElement('ul');
  feedsList.classList.add('list-group');

  state.feeds.forEach((feed) => {
    const {
      title: feedTitle,
      description: feedDescription,
    } = feed;

    const listItem = document.createElement('li');
    listItem.classList.add('list-group-item');

    const feedTitleElement = document.createElement('h3');
    feedTitleElement.textContent = feedTitle;
    feedTitleElement.classList.add('h3');

    const feedDescriptionElement = document.createElement('p');
    feedDescriptionElement.classList.add('mb-0');
    feedDescriptionElement.textContent = feedDescription;

    listItem.append(feedTitleElement, feedDescriptionElement);
    feedsList.append(listItem);
  });

  feedsContainer.append(header, feedsList);
};
