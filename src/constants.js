export const appProcessStates = {
  online: 'online',
  offline: 'offline',
};

export const formProcessStates = {
  filling: 'filling',
  sending: 'sending',
  failed: 'failed',
  finished: 'finished',
};

export const messagesTypes = {
  networkError: 'networkError',
  form: {
    duplicateRSS: 'duplicateRSS',
    invalidRSS: 'invalidRSS',
    invalidURL: 'invalidURL',
    requiredField: 'requiredField',
    addRSS: 'addRSS',
  },
};
