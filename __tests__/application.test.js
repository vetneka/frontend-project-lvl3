import fs from 'fs';
import path from 'path';

import '@testing-library/jest-dom';
import { within, screen, waitFor } from '@testing-library/dom';

import userEvent from '@testing-library/user-event';

import nock from 'nock';

import i18next from 'i18next';
import resources from '../src/locales/index.js';

import rssParser from '../src/rssParser.js';
import run from '../src/init.js';

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
      ru: resources.ru,
    },
  });
});

beforeEach(() => {
  document.body.innerHTML = initialHtml;

  return run()
    .then(() => {
      elements.input = screen.getByRole('textbox', { name: 'url' });
      elements.submit = screen.getByRole('button', { name: 'add' });
      elements.messageContainer = screen.getByTestId('message-container');
      elements.feedsContainer = screen.getByTestId('feeds');
      elements.postsContainer = screen.getByTestId('posts');
      elements.postPreviewModal = screen.getByTestId('postPreviewModal');
    });
});

const getNockScope = (url, response = '', responseStatus = 200) => nock(getProxyHost())
  .get(getProxyPath(url))
  .reply(responseStatus, response, { 'Access-Control-Allow-Origin': '*' });

describe('check interface texts', () => {
  test('feed added successfully', () => {
    const scope = getNockScope(urls.hexlet, rss.hexlet);

    userEvent.type(elements.input, urls.hexlet);
    userEvent.click(elements.submit);

    return waitFor(() => {
      expect(screen.getByText(`${i18nextInstance.t('messages.app.addRSS')}`)).toBeInTheDocument();
      scope.done();
    });
  });

  test('validate required', () => {
    userEvent.type(elements.input, ' ');
    userEvent.click(elements.submit);

    expect(screen.getByText(`${i18nextInstance.t('errors.form.requiredField')}`)).toBeInTheDocument();
  });

  test('validate url', () => {
    userEvent.type(elements.input, 'Rss agregator');
    userEvent.click(elements.submit);

    expect(screen.getByText(`${i18nextInstance.t('errors.form.invalidURL')}`)).toBeInTheDocument();
  });

  test('validate duplicate rss', () => {
    const scope = getNockScope(urls.hexlet, rss.hexlet);

    userEvent.type(elements.input, urls.hexlet);
    userEvent.click(elements.submit);

    return waitFor(() => {
      expect(screen.getByText(`${i18nextInstance.t('messages.app.addRSS')}`)).toBeInTheDocument();
      scope.done();

      userEvent.type(elements.input, urls.hexlet);
      userEvent.click(elements.submit);

      expect(screen.getByText(`${i18nextInstance.t('errors.form.duplicateRSS')}`)).toBeInTheDocument();
    });
  });

  test('parsing rss', () => {
    const urlWithInvalidRSS = 'https://google.com';
    const scope = getNockScope(urlWithInvalidRSS, rss.invalid);

    userEvent.type(elements.input, urlWithInvalidRSS);
    userEvent.click(elements.submit);

    return waitFor(() => {
      expect(screen.getByText(`${i18nextInstance.t('errors.app.invalidRSS')}`)).toBeInTheDocument();
      scope.done();
    });
  });

  test('network error', () => {
    const scope = getNockScope(urls.hexlet, '', 400);

    userEvent.type(elements.input, urls.hexlet);
    userEvent.click(elements.submit);

    return waitFor(() => {
      expect(screen.getByText(`${i18nextInstance.t('errors.app.network')}`)).toBeInTheDocument();
      scope.done();
    });
  });
});

describe('check base UI logic', () => {
  test('form is disabled while submitting', () => {
    const scope = getNockScope(urls.hexlet, '');

    expect(elements.input).not.toHaveAttribute('readonly');
    expect(elements.submit).toBeEnabled();

    userEvent.type(elements.input, urls.hexlet);
    userEvent.click(elements.submit);

    expect(elements.input).toHaveAttribute('readonly');
    expect(elements.submit).toBeDisabled();

    return waitFor(() => {
      expect(elements.input).not.toHaveAttribute('readonly');
      expect(elements.submit).toBeEnabled();
      scope.done();
    });
  });

  test('can add new feeds', () => {
    const scope1 = getNockScope(urls.hexlet, rss.hexlet);
    const scope2 = getNockScope(urls.devTo, rss.devTo);

    const state = {
      addedFeeds: [],
      addedPosts: [],
    };

    state.addedFeeds = [hexletFeed];
    state.addedPosts = [...hexletPosts];

    userEvent.type(elements.input, urls.hexlet);
    userEvent.click(elements.submit);

    return waitFor(() => {
      expect(screen.getByText(`${i18nextInstance.t('messages.app.addRSS')}`)).toBeInTheDocument();
      scope1.done();

      const feedListItems = within(elements.feedsContainer).getAllByRole('listitem');
      const postsListItems = within(elements.postsContainer).getAllByRole('listitem');

      expect(feedListItems.length).toBe(1);
      expect(postsListItems.length).toBe(2);

      checkFeedsStructure(feedListItems, state.addedFeeds);
      checkPostsStructure(postsListItems, state.addedPosts);
    })
      .then(() => {
        state.addedFeeds = [devToFeed, ...state.addedFeeds];
        state.addedPosts = [...devToPosts, ...state.addedPosts];

        userEvent.type(elements.input, urls.devTo);
        userEvent.click(elements.submit);

        return waitFor(() => {
          expect(screen.getByText(`${i18nextInstance.t('messages.app.addRSS')}`)).toBeInTheDocument();
          scope2.done();
        });
      })
      .then(() => {
        const feedListItems = within(elements.feedsContainer).getAllByRole('listitem');
        const postsListItems = within(elements.postsContainer).getAllByRole('listitem');

        expect(feedListItems.length).toBe(2);
        expect(postsListItems.length).toBe(4);

        checkFeedsStructure(feedListItems, state.addedFeeds);
        checkPostsStructure(postsListItems, state.addedPosts);
      });
  });

  test('mark a post as read', () => {
    const scope = getNockScope(urls.hexlet, rss.hexlet);
    const postsContainer = within(elements.postsContainer);

    userEvent.type(elements.input, urls.hexlet);
    userEvent.click(elements.submit);

    return postsContainer.findAllByRole('button')
      .then((previewButtons) => {
        const firstPostButton = previewButtons[0];
        const firstPost = hexletPosts[0];

        expect(postsContainer.getByText(firstPost.title)).not.toHaveClass('fw-normal');
        userEvent.click(firstPostButton);

        return waitFor(() => {
          expect(postsContainer.getByText(firstPost.title)).toHaveClass('fw-normal');
          scope.done();
        });
      });
  });

  test('post preview with correct data', () => {
    const scope = getNockScope(urls.hexlet, rss.hexlet);
    const postsContainer = within(elements.postsContainer);

    userEvent.type(elements.input, urls.hexlet);
    userEvent.click(elements.submit);

    return postsContainer.findAllByRole('button')
      .then(() => {
        const previewButtons = postsContainer.getAllByRole('button');
        const firstPostButton = previewButtons[0];
        const firstPost = hexletPosts[0];

        expect(elements.postPreviewModal).not.toHaveClass('show');

        userEvent.click(firstPostButton);

        return waitFor(() => {
          expect(elements.postPreviewModal).toHaveClass('show');

          expect(within(elements.postPreviewModal).getByText(firstPost.title)).toBeInTheDocument();
          expect(
            within(elements.postPreviewModal).getByText(firstPost.description),
          ).toBeInTheDocument();
        });
      })
      .then(() => {
        const modalCloseButton = within(elements.postPreviewModal).getByText(`${i18nextInstance.t('buttons.modal.close')}`);
        userEvent.click(modalCloseButton);

        return waitFor(() => {
          expect(elements.postPreviewModal).toHaveClass('show');
          scope.done();
        });
      });
  });
});
