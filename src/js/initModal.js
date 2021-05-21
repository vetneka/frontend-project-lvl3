/* eslint no-param-reassign: ["error", { "props": false }] */

import onChange from 'on-change';

const updateState = (previousState, currentState) => Object.assign(previousState, currentState);

const openModal = (modal, data) => {
  const { title, description, link } = data;
  const modalTitleElement = modal.querySelector('.modal-title');
  const modalDescriptionElement = modal.querySelector('.modal-body');
  const modalReadMoreButton = modal.querySelector('.full-article');

  modal.style.display = 'block';
  modal.style.paddingRight = '15px';

  modalTitleElement.textContent = title;
  modalDescriptionElement.textContent = description;
  modalReadMoreButton.href = link;

  document.body.classList.add('modal-open');
  document.body.style.paddingRight = '15px';

  const modalBackdrop = document.createElement('div');
  modalBackdrop.classList.add('modal-backdrop', 'fade');

  document.body.append(modalBackdrop);

  setTimeout(() => {
    modal.classList.add('show');
    modalBackdrop.classList.add('show');
  }, 300);
};

const closeModal = (modal) => {
  modal.classList.remove('show');
  modal.style.paddingRight = '';

  document.body.classList.remove('modal-open');
  document.body.style.paddingRight = '';

  const modalBackdrop = document.querySelector('.modal-backdrop');
  modalBackdrop.classList.remove('show');

  setTimeout(() => {
    modal.style.display = 'none';
    modalBackdrop.remove();
  }, 300);
};

export default (modal) => {
  const state = {
    content: {},
    isOpened: false,
    overlayChecker: false,
  };

  const watchedState = onChange(state, (path, value) => {
    if (path === 'isOpened') {
      if (value === true) {
        openModal(modal, watchedState.content);
      } else {
        closeModal(modal);
      }
    }
  });

  modal.addEventListener('mousedown', (event) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    updateState(watchedState, {
      overlayChecker: true,
    });
  });

  modal.addEventListener('mouseup', (event) => {
    if (state.overlayChecker && event.target === event.currentTarget) {
      updateState(watchedState, {
        isOpened: false,
      });
    }
    updateState(watchedState, {
      overlayChecker: false,
    });
  });

  modal.addEventListener('click', (event) => {
    if (!event.target.closest('[data-dismiss="modal"]')) {
      return;
    }
    event.preventDefault();
    updateState(watchedState, {
      isOpened: false,
    });
  });

  document.addEventListener('keyup', (event) => {
    if (event.code !== 'Escape') {
      return;
    }
    updateState(watchedState, {
      isOpened: false,
    });
  });

  return {
    state: watchedState,
  };
};
