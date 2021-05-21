export default (state) => {
  const feedsContainer = document.querySelector('.feeds');
  feedsContainer.innerHTML = '';

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

  feedsContainer.append(feedsList);
};
