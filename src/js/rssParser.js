import i18n from './libs/i18n.js';

const isValidRSS = (xmlDOM) => xmlDOM.querySelector('parsererror') === null;

export default (string) => {
  const parser = new DOMParser();
  const xmlDOM = parser.parseFromString(string, 'application/xml');

  if (!isValidRSS(xmlDOM)) {
    throw new Error(i18n.t('errorMessages.invalidRSS'));
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

    return {
      title: channelPostTitle.textContent,
      link: channelPostLink.textContent,
      pubDate: new Date(channelPostPubDate.textContent),
    };
  });

  return [channel, posts];
};
