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
  invalid: 'https://google.com',
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

beforeAll(async () => {
  nock.disableNetConnect();

  await i18nextInstance.init({
    lng: 'ru',
    resources: {
      ru: resources.ru,
    },
  });
});

beforeEach(async () => {
  document.body.innerHTML = initialHtml;

  await run();

  elements.input = screen.getByRole('textbox', { name: 'url' });
  elements.submit = screen.getByRole('button', { name: 'add' });
});

const getNockScope = (url, response = '', responseStatus = 200) => nock(getProxyHost())
  .get(getProxyPath(url))
  .reply(responseStatus, response, { 'Access-Control-Allow-Origin': '*' });

describe('check interface texts', () => {
  test('feed added successfully', async () => {
    const scope = getNockScope(urls.hexlet, rss.hexlet);

    userEvent.type(elements.input, urls.hexlet);
    userEvent.click(elements.submit);

    expect(await screen.findByText(`${i18nextInstance.t('messages.app.addRSS')}`)).toBeInTheDocument();
    scope.done();
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

  test('validate duplicate rss', async () => {
    const scope = getNockScope(urls.hexlet, rss.hexlet);

    userEvent.type(elements.input, urls.hexlet);
    userEvent.click(elements.submit);

    expect(await screen.findByText(`${i18nextInstance.t('messages.app.addRSS')}`)).toBeInTheDocument();
    scope.done();

    userEvent.type(elements.input, urls.hexlet);
    userEvent.click(elements.submit);

    expect(screen.getByText(`${i18nextInstance.t('errors.form.duplicateRSS')}`)).toBeInTheDocument();
  });

  test('parsing rss', async () => {
    const scope = getNockScope(urls.invalid, rss.invalid);

    userEvent.type(elements.input, urls.invalid);
    userEvent.click(elements.submit);

    expect(await screen.findByText(`${i18nextInstance.t('errors.app.invalidRSS')}`)).toBeInTheDocument();
    scope.done();
  });

  test('network error', async () => {
    const scope = getNockScope(urls.hexlet, '', 400);

    userEvent.type(elements.input, urls.hexlet);
    userEvent.click(elements.submit);

    expect(await screen.findByText(`${i18nextInstance.t('errors.app.network')}`)).toBeInTheDocument();
    scope.done();
  });
});

describe('check base UI logic', () => {
  test('form is disabled while submitting', async () => {
    const scope = getNockScope(urls.hexlet, '');

    expect(elements.input).not.toHaveAttribute('readonly');
    expect(elements.submit).toBeEnabled();

    userEvent.type(elements.input, urls.hexlet);
    userEvent.click(elements.submit);

    expect(elements.input).toHaveAttribute('readonly');
    expect(elements.submit).toBeDisabled();

    await waitFor(() => {
      expect(elements.input).not.toHaveAttribute('readonly');
      expect(elements.submit).toBeEnabled();
    });

    scope.done();
  });

  test('can add new feeds', async () => {
    const scope1 = getNockScope(urls.hexlet, rss.hexlet);
    const scope2 = getNockScope(urls.devTo, rss.devTo);

    const firstFeed = hexletFeed;
    const firstFeedPost = hexletPosts[0];

    const secondFeed = devToFeed;
    const secondFeedPost = devToPosts[0];

    userEvent.type(elements.input, urls.hexlet);
    userEvent.click(elements.submit);

    expect(await screen.findByText(`${i18nextInstance.t('messages.app.addRSS')}`)).toBeInTheDocument();
    scope1.done();

    expect(screen.getByText(firstFeed.title)).toBeInTheDocument();
    expect(screen.getByText(firstFeed.description)).toBeInTheDocument();
    expect(screen.getByText(firstFeedPost.title)).toBeInTheDocument();

    userEvent.type(elements.input, urls.devTo);
    userEvent.click(elements.submit);

    expect(await screen.findByText(`${i18nextInstance.t('messages.app.addRSS')}`)).toBeInTheDocument();
    scope2.done();

    expect(screen.getByText(secondFeed.title)).toBeInTheDocument();
    expect(screen.getByText(secondFeed.description)).toBeInTheDocument();
    expect(screen.getByText(secondFeedPost.title)).toBeInTheDocument();

    const feedListItems = within(screen.getByTestId('feeds')).getAllByRole('listitem');
    const postsListItems = within(screen.getByTestId('posts')).getAllByRole('listitem');

    expect(feedListItems).toHaveLength(2);
    expect(postsListItems).toHaveLength(4);

    expect(within(feedListItems[0]).getByText(secondFeed.title)).toBeInTheDocument();
    expect(within(postsListItems[0]).getByText(secondFeedPost.title)).toBeInTheDocument();
  });

  test('mark a post as read', async () => {
    const scope = getNockScope(urls.hexlet, rss.hexlet);
    const postsContainer = screen.getByTestId('posts');

    userEvent.type(elements.input, urls.hexlet);
    userEvent.click(elements.submit);

    const previewButtons = await within(postsContainer).findAllByText(`${i18nextInstance.t('buttons.postPreview')}`);

    const firstPostButton = previewButtons[0];
    const firstPost = hexletPosts[0];

    expect(within(postsContainer).getByText(firstPost.title)).not.toHaveClass('fw-normal');

    userEvent.click(firstPostButton);

    expect(await within(postsContainer).findByText(firstPost.title)).toHaveClass('fw-normal');

    scope.done();
  });

  test('post preview with correct data', async () => {
    const scope = getNockScope(urls.hexlet, rss.hexlet);

    const postsContainer = screen.getByTestId('posts');
    const postPreviewModal = screen.getByTestId('postPreviewModal');

    userEvent.type(elements.input, urls.hexlet);
    userEvent.click(elements.submit);

    const previewButtons = await within(postsContainer).findAllByText(`${i18nextInstance.t('buttons.postPreview')}`);

    const firstPostButton = previewButtons[0];
    const firstPost = hexletPosts[0];

    expect(postPreviewModal).not.toHaveClass('show');
    userEvent.click(firstPostButton);

    await waitFor(() => {
      expect(postPreviewModal).toHaveClass('show');
    });

    expect(within(postPreviewModal).getByText(firstPost.title)).toBeInTheDocument();
    expect(within(postPreviewModal).getByText(firstPost.description)).toBeInTheDocument();

    scope.done();
  });
});
