import * as yup from 'yup';
import { errors } from './constants.js';

const isDuplicateFeed = (feeds, url) => feeds
  .find((feed) => feed.url === url) !== undefined;

export default (feeds, value) => {
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
