/* eslint no-param-reassign: ["error", { "props": false }] */

import * as yup from 'yup';
import onChange from 'on-change';
import { uniqueId } from 'lodash';
import i18n from './libs/i18n.js';
import formProcessStates from './constants.js';
import parseRSS from './rssParser.js';
import {
  render,
  renderError,
  renderForm,
} from './renderers/index.js';

const scheme = yup.string().url().required();

const getRSSUrl = (url) => `https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(url)}`;
const isValidURL = (url) => scheme.isValidSync(url);
const isDuplicateRSS = (state, url) => state.channels
  .find((channel) => channel.url === url) !== undefined;

const checkUpdate = (state) => {
  const requests = state.channels.map((channel) => fetch(getRSSUrl(channel.url)));
  return Promise.all(requests)
    .then((responses) => Promise.all(responses.map((response) => response.json())))
    .then((channelsContent) => {
      const parsedChannels = channelsContent.map((channel) => parseRSS(channel.contents));

      return parsedChannels.forEach(([, newPosts], index) => {
        const oldPosts = state.posts.filter((post) => post.channelId === state.channels[index].id);
        const [newestOldPost] = oldPosts;

        const newestPosts = newPosts
          .filter((newPost) => newPost.pubDate > newestOldPost.pubDate)
          .map((newestPost) => ({
            ...newestPost,
            id: uniqueId(),
            channelId: state.channels[index].id,
          }));

        state.posts = [...newestPosts, ...state.posts];
      });
    })
    .catch((error) => {
      console.log('checkUpdateError', error);
    })
    .finally(() => {
      setTimeout(checkUpdate, 5000, state);
    });
};

// const feedWatcher = (state) => {
//   state.feedWatcher.isEnabled = false;

//   return Promise.all(state.feeds.map((feed) => fetch(getRSSUrl(feed.url))))
//     .then((responses) => Promise.all(responses
//       // .filter((response) => response.value)
//       .map((response) => response.json())))
//     .then((channels) => {
//       const newPosts = channels
//         .filter((channel) => channel.status.http_code === 200)
//         .flatMap((channel) => {
//           const currentFeed = state.feeds
//             .find((feed) => feed.url === channel.status.url);

//           const [, currentPosts] = parseRSS(channel.contents, currentFeed.url, currentFeed.id);
//           const [lastNewFeedPost = []] = state.posts
//             .filter((post) => post.feedId === currentFeed.id);

//           return currentPosts
//             .filter((currentPost) => currentPost.postPubDate > lastNewFeedPost.postPubDate);
//         });

//       state.posts = [...newPosts, ...state.posts];

//       state.feedWatcher.isEnabled = true;

//       state.onlineState = Object.assign(state.onlineState, {
//         isOnline: true,
//         message: 'Online',
//       });
//     })
//     .catch((error) => {
//       console.log('watcher error');

//       state.feedWatcher.isEnabled = true;

//       state.onlineState = Object.assign(state.onlineState, {
//         isOnline: false,
//         message: 'Offline',
//       });

//       // state.feedWatcher.isEnabled = true;

//       console.log(state);
//       const errorMessage = error.message;

//       if (errorMessage === i18n.t('errorMessages.invalidRSS')) {
//         console.log(i18n.t('errorMessages.invalidRSS'));
//       }

//       if (errorMessage === i18n.t('errorMessages.network')) {
//         watchedState.network = false;
//       }

//       throw error;
//     });
// };

export default () => {
  const state = {
    channels: [],
    posts: [],
    form: {
      valid: true,
      processState: formProcessStates.filling,
      processMessage: '',
    },
    feedWatcher: {
      isEnabled: false,
    },
    onlineState: {
      message: '',
      isOnline: true,
    },
  };

  const formElements = {
    form: document.querySelector('.feed-form'),
    input: document.querySelector('[name="add-rss"]'),
    submitButton: document.querySelector('button[type="submit"]'),
    messageContainer: document.querySelector('.message-container'),
  };

  const watchedState = onChange(state, (path, value, prevValue) => {
    if (path.startsWith('form')) {
      renderForm(state, formElements);
    }

    if (path === 'posts') {
      render(state);
    }

    if (path === 'channels') {
      if (prevValue.length === 0) {
        checkUpdate(watchedState);
      }
      render(state);
    }

    if (path.startsWith('onlineState')) {
      renderError(watchedState);
    }
  });

  formElements.form.addEventListener('submit', (event) => {
    event.preventDefault();

    watchedState.form = Object.assign(watchedState.form, {
      processState: formProcessStates.sending,
    });

    const formData = new FormData(event.target);
    const rssUrl = formData.get('add-rss');

    if (isDuplicateRSS(watchedState, rssUrl)) {
      watchedState.form = Object.assign(watchedState.form, {
        valid: false,
        processState: formProcessStates.failed,
        processMessage: i18n.t('errorMessages.duplicateRSS'),
      });
      return;
    }

    if (!isValidURL(rssUrl)) {
      watchedState.form = Object.assign(watchedState.form, {
        valid: false,
        processState: formProcessStates.failed,
        processMessage: i18n.t('errorMessages.invalidURL'),
      });
      return;
    }

    watchedState.form = Object.assign(watchedState.form, {
      valid: true,
    });

    fetch(getRSSUrl(rssUrl))
      .then((responce) => responce.json())
      .then((data) => {
        const [channel, posts] = parseRSS(data.contents);

        const newChannel = {
          ...channel,
          id: uniqueId(),
          url: rssUrl,
        };

        const newPosts = posts.map((post) => ({
          ...post,
          id: uniqueId(),
          channelId: newChannel.id,
        }));

        watchedState.channels = [newChannel, ...watchedState.channels];
        watchedState.posts = [...newPosts, ...watchedState.posts];

        watchedState.form = Object.assign(watchedState.form, {
          processState: formProcessStates.finished,
          processMessage: i18n.t('successMessages.addRSS'),
        });

        setTimeout(() => {
          watchedState.form = Object.assign(watchedState.form, {
            processState: formProcessStates.filling,
            processMessage: '',
          });
        }, 2000);
      })
      .catch((error) => {
        const errorMessage = error.message;

        if (errorMessage === i18n.t('errorMessages.invalidRSS')) {
          watchedState.form = Object.assign(watchedState.form, {
            processMessage: i18n.t('errorMessages.invalidRSS'),
          });
        }

        if (errorMessage === i18n.t('errorMessages.network')) {
          watchedState.form = Object.assign(watchedState.form, {
            processMessage: i18n.t('errorMessages.network'),
          });
        }

        watchedState.form = Object.assign(watchedState.form, {
          processState: formProcessStates.failed,
        });

        throw error;
      });
  });
};
