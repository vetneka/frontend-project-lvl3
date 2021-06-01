/* eslint no-param-reassign: ["error", { "props": false }] */

export default (state, container, i18nextInstance) => {
  container.innerHTML = '';

  const header = document.createElement('h2');
  header.textContent = i18nextInstance.t('headlines.feeds');

  if (state.feeds.length === 0) {
    const p = document.createElement('p');
    p.textContent = i18nextInstance.t('noFeeds');
    container.append(header, p);
    return;
  }

  const feedsList = document.createElement('ul');
  feedsList.classList.add('list-group');

  const feedListItems = state.feeds.map((feed) => {
    const item = document.createElement('li');
    item.classList.add('list-group-item');

    const title = document.createElement('h3');
    title.classList.add('h3');
    title.textContent = feed.title;

    const description = document.createElement('p');
    description.classList.add('mb-0');
    description.textContent = feed.description;

    item.append(title, description);

    return item;
  });

  feedsList.append(...feedListItems);
  container.append(header, feedsList);
};
