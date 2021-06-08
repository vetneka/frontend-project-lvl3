import { isObject, isArray } from 'lodash';

const customMerge = (obj, newObj) => {
  /* eslint no-param-reassign: ["error", { "props": false }] */
  Object.keys(newObj).forEach((key) => {
    const value = obj[key];

    if (isObject(value) && !isArray(value)) {
      customMerge(obj[key], newObj[key]);
    } else {
      obj[key] = newObj[key];
    }
  });
};

export default function updateState(newState) {
  customMerge(updateState.state, newState);
}
