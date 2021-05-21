import { formProcessStates } from '../constants.js';

export default (state, formElements, i18nextInstance) => {
  const {
    input,
    submitButton,
    messageContainer,
  } = formElements;

  if (state.form.valid) {
    input.classList.remove('is-invalid');
  } else {
    input.classList.add('is-invalid');
  }

  if (state.form.processState === formProcessStates.sending) {
    input.disabled = true;
    submitButton.disabled = true;
  } else {
    input.disabled = false;
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

  messageContainer.textContent = i18nextInstance.t(`messages.${state.form.messageType}`);
};
