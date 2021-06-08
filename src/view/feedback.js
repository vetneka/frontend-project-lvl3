import { processStates } from '../constants.js';

export default (state, elements, i18nextInstance) => {
  const { messageContainer } = elements;

  messageContainer.textContent = '';
  messageContainer.classList.remove('show', 'text-danger', 'text-success');

  setTimeout(() => {
    if (state.processState === processStates.failed) {
      messageContainer.classList.add('text-danger');
      messageContainer.textContent = i18nextInstance.t(`errors.app.${state.processStateError}`);
    }

    if (state.processState === processStates.finished) {
      messageContainer.classList.add('text-success');
      messageContainer.textContent = i18nextInstance.t('messages.app.addRSS');
    }

    if (state.form.processState === processStates.failed) {
      messageContainer.classList.add('text-danger');
      messageContainer.textContent = i18nextInstance.t(`errors.form.${state.form.processStateError}`);
    }

    messageContainer.classList.add('show');
  }, 100);
};
