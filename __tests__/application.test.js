import fs from 'fs';
import path from 'path';

import '@testing-library/jest-dom';
import { within, screen, waitFor } from '@testing-library/dom';

import userEvent from '@testing-library/user-event';

import nock from 'nock';

import i18next from 'i18next';
import ru from '../src/locales/ru/translation.js';

import rssParser from '../src/js/rssParser.js';
import run from '../src/js/init.js';

const getFixturesPath = (fileName) => path.join('__fixtures__', fileName);
const readFile = (fileName) => fs.readFileSync(getFixturesPath(fileName), 'utf-8');

const getProxyHost = () => 'https://hexlet-allorigins.herokuapp.com';
const getProxyPath = (url) => `/get?url=${url}&disableCache=true`;

const initialHtml = readFile('index.html');

const i18nextInstance = i18next.createInstance();

const elements = {};

const urls = {
  hexlet: 'https://ru.hexlet.io/lessons.rss',
  devTo: 'https://dev.to/feed',
};

const rss = {
  hexlet: {
    contents: readFile('hexlet.rss'),
  },
  devTo: {
    contents: readFile('devTo.rss'),
  },
  invalid: {
    contents: readFile('index.html'),
  },
};

const [hexletFeed, hexletPosts] = rssParser(rss.hexlet.contents);
const [devToFeed, devToPosts] = rssParser(rss.devTo.contents);

const checkFeedsStructure = (screenFeeds, addedFeeds) => {
  screenFeeds.forEach((screenFeedItem, index) => {
    const {
      title: addedFeedTitle,
      description: addedFeedDescription,
    } = addedFeeds[index];

    expect(within(screenFeedItem).getByText(addedFeedTitle)).toBeInTheDocument();
    expect(within(screenFeedItem).getByText(addedFeedDescription)).toBeInTheDocument();
  });
};

const checkPostsStructure = (screenPosts, addedPosts) => {
  screenPosts.forEach((screenPostItem, index) => {
    const { title: addedPostTitle } = addedPosts[index];

    expect(within(screenPostItem).getByText(addedPostTitle)).toBeInTheDocument();
    expect(within(screenPostItem).getByRole('button')).toHaveTextContent(`${i18nextInstance.t('buttons.postPreview')}`);
  });
};

beforeAll(() => {
  nock.disableNetConnect();

  return i18nextInstance.init({
    lng: 'ru',
    resources: {
      ru,
    },
  });
});

beforeEach(() => {
  document.body.innerHTML = initialHtml;

  run(() => {});

  elements.input = screen.getByRole('textbox');
  elements.submit = screen.getByRole('button');
  elements.messageContainer = document.querySelector('.message-container');
  elements.feedsContainer = document.querySelector('.feeds');
  elements.postsContainer = document.querySelector('.posts');
  elements.postPreviewModal = document.querySelector('#postPreviewModal');
});

describe('check interface texts', () => {
  test('feed added successfully', () => {
    const scope = nock(getProxyHost())
      .get(getProxyPath(urls.hexlet))
      .reply(200, rss.hexlet, { 'Access-Control-Allow-Origin': '*' });

    userEvent.type(elements.input, urls.hexlet);
    userEvent.click(elements.submit);

    return waitFor(() => {
      expect(screen.getByText(`${i18nextInstance.t('messages.form.addRSS')}`)).toBeInTheDocument();
    })
      .then(() => {
        scope.done();
      });
  });

  test('validate required', () => {
    userEvent.type(elements.input, ' ');
    userEvent.click(elements.submit);

    return waitFor(() => {
      expect(screen.getByText(`${i18nextInstance.t('messages.form.requiredField')}`)).toBeInTheDocument();
    });
  });

  test('validate url', () => {
    userEvent.type(elements.input, 'Rss agregator');
    userEvent.click(elements.submit);

    return waitFor(() => {
      expect(screen.getByText(`${i18nextInstance.t('messages.form.invalidURL')}`)).toBeInTheDocument();
    });
  });

  test('validate duplicate rss', () => {
    const scope = nock(getProxyHost())
      .get(getProxyPath(urls.hexlet))
      .reply(200, rss.hexlet, { 'Access-Control-Allow-Origin': '*' });

    userEvent.type(elements.input, urls.hexlet);
    userEvent.click(elements.submit);

    return waitFor(() => {
      expect(screen.getByText(`${i18nextInstance.t('messages.form.addRSS')}`)).toBeInTheDocument();
    })
      .then(() => {
        userEvent.type(elements.input, urls.hexlet);
        userEvent.click(elements.submit);

        return waitFor(() => {
          expect(screen.getByText(`${i18nextInstance.t('messages.form.duplicateRSS')}`)).toBeInTheDocument();
        });
      })
      .then(() => {
        scope.done();
      });
  });

  test('parsing rss', () => {
    const urlWithInvalidRSS = 'https://google.com';

    const scope = nock(getProxyHost())
      .get(getProxyPath(urlWithInvalidRSS))
      .reply(200, rss.invalid, { 'Access-Control-Allow-Origin': '*' });

    userEvent.type(elements.input, urlWithInvalidRSS);
    userEvent.click(elements.submit);

    return waitFor(() => {
      expect(screen.getByText(`${i18nextInstance.t('messages.form.invalidRSS')}`)).toBeInTheDocument();
    })
      .then(() => {
        scope.done();
      });
  });

  test('network error', () => {
    const scope = nock(getProxyHost())
      .get(getProxyPath(urls.hexlet))
      .reply(400, '', { 'Access-Control-Allow-Origin': '*' });

    userEvent.type(elements.input, urls.hexlet);
    userEvent.click(elements.submit);

    return waitFor(() => {
      expect(screen.getByText(`${i18nextInstance.t('messages.networkError')}`)).toBeInTheDocument();
    })
      .then(() => {
        scope.done();
      });
  });
});

describe('check base UI logic', () => {
  test('form is disabled while submitting', () => {
    const scope = nock(getProxyHost())
      .get(getProxyPath(urls.hexlet))
      .reply(200, '', { 'Access-Control-Allow-Origin': '*' });

    expect(elements.input).not.toHaveAttribute('readonly');
    expect(elements.submit).not.toBeDisabled();

    userEvent.type(elements.input, urls.hexlet);
    userEvent.click(elements.submit);

    expect(elements.input).toHaveAttribute('readonly');
    expect(elements.submit).toBeDisabled();

    return waitFor(() => {
      expect(elements.input).not.toHaveAttribute('readonly');
      expect(elements.submit).not.toBeDisabled();
    })
      .then(() => {
        scope.done();
      });
  });

  test('can add new feeds', () => {
    const scope1 = nock(getProxyHost())
      .get(getProxyPath(urls.hexlet))
      .reply(200, rss.hexlet, { 'Access-Control-Allow-Origin': '*' });

    const scope2 = nock(getProxyHost())
      .get(getProxyPath(urls.devTo))
      .reply(200, rss.devTo, { 'Access-Control-Allow-Origin': '*' });

    const state = {
      addedFeeds: [],
      addedPosts: [],
    };

    state.addedFeeds = [hexletFeed];
    state.addedPosts = [...hexletPosts];

    userEvent.type(elements.input, urls.hexlet);
    userEvent.click(elements.submit);

    return waitFor(() => {
      expect(screen.getByText(`${i18nextInstance.t('messages.form.addRSS')}`)).toBeInTheDocument();
    })
      .then(() => {
        const feedListItems = within(elements.feedsContainer).getAllByRole('listitem');
        const postsListItems = within(elements.postsContainer).getAllByRole('listitem');

        expect(feedListItems).toHaveLength(1);
        expect(postsListItems).toHaveLength(2);

        checkFeedsStructure(feedListItems, state.addedFeeds);
        checkPostsStructure(postsListItems, state.addedPosts);
      })
      .then(() => {
        state.addedFeeds = [devToFeed, ...state.addedFeeds];
        state.addedPosts = [...devToPosts, ...state.addedPosts];

        userEvent.type(elements.input, urls.devTo);
        userEvent.click(elements.submit);

        return waitFor(() => {
          expect(screen.getByText(`${i18nextInstance.t('messages.form.addRSS')}`)).toBeInTheDocument();
        });
      })
      .then(() => {
        const feedListItems = within(elements.feedsContainer).getAllByRole('listitem');
        const postsListItems = within(elements.postsContainer).getAllByRole('listitem');

        expect(feedListItems).toHaveLength(2);
        expect(postsListItems).toHaveLength(4);

        checkFeedsStructure(feedListItems, state.addedFeeds);
        checkPostsStructure(postsListItems, state.addedPosts);

        scope1.done();
        scope2.done();
      });
  });

  test('mark a post as read', () => {
    const scope = nock(getProxyHost())
      .get(getProxyPath(urls.hexlet))
      .reply(200, rss.hexlet, { 'Access-Control-Allow-Origin': '*' });

    userEvent.type(elements.input, urls.hexlet);
    userEvent.click(elements.submit);

    return waitFor(() => {
      expect(screen.getByText(`${i18nextInstance.t('messages.form.addRSS')}`)).toBeInTheDocument();
    })
      .then(() => {
        const previewButtons = within(elements.postsContainer).getAllByRole('button');
        const firstPostButton = previewButtons[0];
        const firstPost = hexletPosts[0];

        expect(within(elements.postsContainer).getByText(firstPost.title)).not.toHaveClass('font-weight-normal');

        userEvent.click(firstPostButton);

        return waitFor(() => {
          expect(within(elements.postsContainer).getByText(firstPost.title)).toHaveClass('font-weight-normal');
        });
      })
      .then(() => {
        scope.done();
      });
  });

  test('post preview with correct data', () => {
    const scope = nock(getProxyHost())
      .get(getProxyPath(urls.hexlet))
      .reply(200, rss.hexlet, { 'Access-Control-Allow-Origin': '*' });

    const modalCloseButton = within(elements.postPreviewModal).getByText(`${i18nextInstance.t('buttons.modal.close')}`);

    userEvent.type(elements.input, urls.hexlet);
    userEvent.click(elements.submit);

    return waitFor(() => {
      expect(screen.getByText(`${i18nextInstance.t('messages.form.addRSS')}`)).toBeInTheDocument();
    })
      .then(() => {
        const previewButtons = within(elements.postsContainer).getAllByRole('button');
        const firstPostButton = previewButtons[0];
        const firstPost = hexletPosts[0];

        expect(elements.postPreviewModal).not.toHaveClass('show');

        userEvent.click(firstPostButton);

        return waitFor(() => {
          expect(elements.postPreviewModal).toHaveClass('show');

          expect(within(elements.postPreviewModal).getByText(firstPost.title)).toBeTruthy();
          expect(within(elements.postPreviewModal).getByText(firstPost.description)).toBeTruthy();
        });
      })
      .then(() => {
        userEvent.click(modalCloseButton);

        return waitFor(() => {
          expect(elements.postPreviewModal).not.toHaveClass('show');
        });
      })
      .then(() => {
        scope.done();
      });
  });
});
