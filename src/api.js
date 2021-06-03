import { differenceWith } from 'lodash';
import axios from 'axios';

import { errors } from './constants.js';
import updateState from './utils.js';
import { normalizePosts, rssParser } from './rss/index.js';

export const getProxyUrl = (url) => (
  `https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(url)}&disableCache=true`
);

export const loadRssFeed = (url) => axios(getProxyUrl(url))
  .then((response) => {
    const { contents } = response.data;
    return contents;
  })
  .catch(() => {
    throw new Error(errors.app.network);
  });

export const loadNewPosts = (feeds) => {
  const requests = feeds.map(({ url }) => loadRssFeed(url));
  return Promise.all(requests)
    .then((rssFeeds) => rssFeeds.flatMap((rssFeed, index) => {
      const currentFeed = feeds[index];
      const [, posts] = rssParser(rssFeed);

      return normalizePosts(posts, currentFeed.id);
    }));
};

export const listenToNewPosts = (watchedState) => {
  const timeoutMs = 5000;

  if (watchedState.feeds.length === 0) {
    setTimeout(listenToNewPosts, timeoutMs, watchedState);
    return;
  }

  loadNewPosts(watchedState.feeds)
    .then((newPosts) => {
      const newUniquePosts = differenceWith(
        newPosts,
        watchedState.posts,
        (newPost, oldPost) => newPost.pubDate <= oldPost.pubDate,
      );

      updateState({
        posts: [...newUniquePosts, ...watchedState.posts],
      });
    })
    .finally(() => {
      setTimeout(listenToNewPosts, timeoutMs, watchedState);
    });
};
