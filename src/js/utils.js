import { uniqueId } from 'lodash';

export const getProxyFor = (url) => (
  `https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(url)}&disableCache=true`
);

export const isDuplicateFeed = (feeds, url) => feeds
  .find((feed) => feed.url === url) !== undefined;

export const updateState = (previousState, currentState) => (
  Object.assign(previousState, currentState)
);

export const normalizeFeed = (feed, options = {}) => ({
  ...feed,
  id: uniqueId(),
  ...options,
});

export const normalizePosts = (posts, options = {}) => posts.map((post) => ({
  ...post,
  id: uniqueId(),
  ...options,
}));
