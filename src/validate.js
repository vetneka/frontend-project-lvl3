import * as yup from 'yup';

export default (value, uniqueValues) => {
  const scheme = yup
    .string()
    .trim()
    .required()
    .url()
    .notOneOf(uniqueValues);

  try {
    scheme.validateSync(value);

    return null;
  } catch (error) {
    return error;
  }
};
