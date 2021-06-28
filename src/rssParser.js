import { errors } from './constants.js';

export default (string) => {
  const parser = new DOMParser();
  const xmlDOM = parser.parseFromString(string, 'application/xml');

  const error = xmlDOM.querySelector('parsererror');

  if (error) {
    throw new Error(errors.app.rssParser);
  }

  const titleElement = xmlDOM.querySelector('title');
  const descriptionElement = xmlDOM.querySelector('description');

  const itemsElements = xmlDOM.querySelectorAll('item');

  const items = [...itemsElements].map((item) => {
    const itemTitle = item.querySelector('title');
    const itemLink = item.querySelector('link');
    const itemPubDate = item.querySelector('pubDate');
    const itemDescription = item.querySelector('description');

    return {
      title: itemTitle.textContent,
      link: itemLink.textContent,
      pubDate: new Date(itemPubDate.textContent),
      description: itemDescription.textContent,
    };
  });

  return {
    title: titleElement.textContent,
    description: descriptionElement.textContent,
    items,
  };
};
