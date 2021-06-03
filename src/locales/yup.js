import { errors } from '../constants.js';

export default {
  mixed: {
    required: errors.form.requiredField,
  },
  string: {
    url: errors.form.invalidURL,
  },
};
