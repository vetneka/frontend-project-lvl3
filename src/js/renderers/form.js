import { formProcessStates } from '../constants.js';

export default (state, formElements, i18nextInstance) => {
  const {
    input,
    submitButton,
    messageContainer,
  } = formElements;

  submitButton.textContent = i18nextInstance.t('buttons.addFeed');

  if (state.form.valid) {
    input.classList.remove('is-invalid');
  } else {
    input.classList.add('is-invalid');
  }

  if (state.form.processState === formProcessStates.sending) {
    input.readOnly = true;
    submitButton.disabled = true;
  } else {
    input.readOnly = false;
    submitButton.disabled = false;
  }

  if (state.form.processState === formProcessStates.finished) {
    messageContainer.classList.remove('text-danger');
    messageContainer.classList.add('text-success');
    input.value = '';
    input.focus();
  }

  if (state.form.processState === formProcessStates.failed) {
    messageContainer.classList.remove('text-success');
    messageContainer.classList.add('text-danger');
  }

  messageContainer.textContent = (state.form.messageType)
    ? i18nextInstance.t(`messages.form.${state.form.messageType}`)
    : '';
};
