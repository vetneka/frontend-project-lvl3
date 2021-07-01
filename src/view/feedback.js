import processStates from '../constants.js';

export default (state, elements, i18nextInstance) => {
  const { messageContainer } = elements;

  messageContainer.textContent = '';
  messageContainer.classList.remove('show', 'text-danger', 'text-success');

  if (state.processState === processStates.failed) {
    messageContainer.textContent = i18nextInstance.t(`${state.processStateError}`);
    messageContainer.classList.add('text-danger', 'show');
  }

  if (state.processState === processStates.finished) {
    messageContainer.textContent = i18nextInstance.t('messages.app.addRSS');
    messageContainer.classList.add('text-success', 'show');
  }

  if (state.form.processState === processStates.failed) {
    messageContainer.textContent = i18nextInstance.t(`${state.form.processStateError}`);
    messageContainer.classList.add('text-danger', 'show');
  }
};
