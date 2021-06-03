import * as yup from 'yup';
import { uniqueId } from 'lodash';

import { errors } from '../constants.js';

const isDuplicateFeed = (feeds, url) => feeds
  .find((feed) => feed.url === url) !== undefined;

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

export const validate = (feeds, value) => {
  const scheme = yup.string().trim().required().url();

  try {
    scheme.validateSync(value);

    if (isDuplicateFeed(feeds, value)) {
      throw new Error(errors.form.duplicateRSS);
    }

    return null;
  } catch (error) {
    return error;
  }
};
