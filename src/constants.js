export const processStates = {
  initial: 'initial',
  sending: 'sending',
  failed: 'failed',
  finished: 'finished',
};

export const errors = {
  app: {
    network: 'network',
    rssParser: 'rssParser',
    unknown: 'unknown',
  },
  form: {
    duplicateURL: 'duplicateURL',
    invalidURL: 'invalidURL',
    requiredField: 'requiredField',
  },
};
