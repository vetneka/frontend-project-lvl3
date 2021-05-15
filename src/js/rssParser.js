import { messagesTypes } from './constants.js';

const isValidRSS = (rss) => rss.querySelector('parsererror') === null;

export default (string) => {
  const parser = new DOMParser();
  const xmlDOM = parser.parseFromString(string, 'application/xml');
  console.log(xmlDOM);
  if (!isValidRSS(xmlDOM)) {
    throw new Error(messagesTypes.invalidRSS);
  }

  const channelTitle = xmlDOM.querySelector('title');
  const channelDescription = xmlDOM.querySelector('description');

  const channel = {
    title: channelTitle.textContent,
    description: channelDescription.textContent,
  };

  const channelPosts = xmlDOM.querySelectorAll('item');

  const posts = [...channelPosts].map((channelPost) => {
    const channelPostTitle = channelPost.querySelector('title');
    const channelPostLink = channelPost.querySelector('link');
    const channelPostPubDate = channelPost.querySelector('pubDate');
    const channelPostDescription = channelPost.querySelector('description');

    return {
      title: channelPostTitle.textContent,
      link: channelPostLink.textContent,
      pubDate: new Date(channelPostPubDate.textContent),
      description: channelPostDescription.textContent,
    };
  });

  return [channel, posts];
};
