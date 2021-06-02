/* eslint no-param-reassign: ["error", { "props": false }] */

import { uniqueId, isObject, isArray } from 'lodash';

export const getProxyFor = (url) => (
  `https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(url)}&disableCache=true`
);

export const isDuplicateFeed = (feeds, url) => feeds
  .find((feed) => feed.url === url) !== undefined;

const customMerge = (obj, newObj) => {
  Object.keys(newObj).forEach((key) => {
    const value = obj[key];

    if (isObject(value) && !isArray(value)) {
      customMerge(obj[key], newObj[key]);
    } else {
      obj[key] = newObj[key];
    }
  });
};

export const updateState = function updateState(newState) {
  customMerge(updateState.state, newState);
};

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
