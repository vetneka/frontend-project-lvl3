export const processStates = {
  initial: 'initial',
  sending: 'sending',
  failed: 'failed',
  finished: 'finished',
};

export const errors = {
  app: {
    network: 'network',
    invalidRSS: 'invalidRSS',
  },
  form: {
    duplicateRSS: 'duplicateRSS',
    invalidURL: 'invalidURL',
    requiredField: 'requiredField',
  },
};
