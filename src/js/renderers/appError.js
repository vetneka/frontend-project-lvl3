export default (messageType, elements, i18nextInstance) => {
  const { messageContainer } = elements;

  messageContainer.classList.remove('show');

  setTimeout(() => {
    messageContainer.classList.add('text-danger');

    messageContainer.textContent = (messageType)
      ? i18nextInstance.t(`messages.${messageType}`)
      : '';
  }, 100);
};
