import processStates from '../constants.js';

export default (state, formElements, i18nextInstance) => {
  const {
    input,
    submitButton,
  } = formElements;

  submitButton.textContent = i18nextInstance.t('buttons.addFeed');

  if (state.form.valid) {
    input.classList.remove('is-invalid');
  } else {
    input.classList.add('is-invalid');
  }

  if (state.form.processState === processStates.sending) {
    input.readOnly = true;
    submitButton.disabled = true;
  } else {
    input.readOnly = false;
    submitButton.disabled = false;
  }

  if (state.form.processState === processStates.initial) {
    input.focus();
  }

  if (state.form.processState === processStates.finished) {
    input.value = '';
    input.focus();
  }
};
