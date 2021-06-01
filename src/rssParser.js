import { messagesTypes } from './constants.js';

const isValidRSS = (rss) => rss.querySelector('parsererror') === null;

export default (string) => {
  const parser = new DOMParser();
  const xmlDOM = parser.parseFromString(string, 'application/xml');

  if (!isValidRSS(xmlDOM)) {
    throw new Error(messagesTypes.form.invalidRSS);
  }

  const feedTitle = xmlDOM.querySelector('title');
  const feedDescription = xmlDOM.querySelector('description');

  const feed = {
    title: feedTitle.textContent,
    description: feedDescription.textContent,
  };

  const feedPosts = xmlDOM.querySelectorAll('item');

  const posts = [...feedPosts].map((feedPost) => {
    const feedPostTitle = feedPost.querySelector('title');
    const feedPostLink = feedPost.querySelector('link');
    const feedPostPubDate = feedPost.querySelector('pubDate');
    const feedPostDescription = feedPost.querySelector('description');

    return {
      title: feedPostTitle.textContent,
      link: feedPostLink.textContent,
      pubDate: new Date(feedPostPubDate.textContent),
      description: feedPostDescription.textContent,
    };
  });

  return [feed, posts];
};