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

const {
  title: firstFeedTitle,
  description: firstFeedDescription,
  items: hexletPosts,
} = rssParser(rss.hexlet.contents);

const {
  title: secondFeedTitle,
  description: secondFeedDescription,
  items: devToPosts,
} = rssParser(rss.devTo.contents);

beforeAll(async () => {
  nock.disableNetConnect();

  await i18nextInstance.init({
    lng: 'ru',
    resources: {
      ru: resources.ru,
    },
  });
});

afterAll(() => {
  nock.cleanAll();
  nock.enableNetConnect();
});

beforeEach(async () => {
  document.body.innerHTML = initialHtml;

  await run();
});

describe('check interface texts', () => {
  test('feed added successfully', async () => {
    nock(getProxyHost())
      .persist()
      .get(getProxyPath(urls.hexlet))
      .reply(200, rss.hexlet, { 'Access-Control-Allow-Origin': '*' });

    userEvent.type(screen.getByRole('textbox', { name: 'url' }), urls.hexlet);
    userEvent.click(screen.getByRole('button', { name: 'add' }));

    expect(await screen.findByText(`${i18nextInstance.t('messages.app.addRSS')}`)).toBeInTheDocument();
  });

  test('validate required', () => {
    userEvent.type(screen.getByRole('textbox', { name: 'url' }), ' ');
    userEvent.click(screen.getByRole('button', { name: 'add' }));

    expect(screen.getByText(`${i18nextInstance.t('errors.form.requiredField')}`)).toBeInTheDocument();
  });

  test('validate url', () => {
    userEvent.type(screen.getByRole('textbox', { name: 'url' }), 'Rss agregator');
    userEvent.click(screen.getByRole('button', { name: 'add' }));

    expect(screen.getByText(`${i18nextInstance.t('errors.form.invalidURL')}`)).toBeInTheDocument();
  });

  test('validate duplicate rss', async () => {
    nock(getProxyHost())
      .persist()
      .get(getProxyPath(urls.hexlet))
      .reply(200, rss.hexlet, { 'Access-Control-Allow-Origin': '*' });

    userEvent.type(screen.getByRole('textbox', { name: 'url' }), urls.hexlet);
    userEvent.click(screen.getByRole('button', { name: 'add' }));

    expect(await screen.findByText(`${i18nextInstance.t('messages.app.addRSS')}`)).toBeInTheDocument();

    userEvent.type(screen.getByRole('textbox', { name: 'url' }), urls.hexlet);
    userEvent.click(screen.getByRole('button', { name: 'add' }));

    expect(screen.getByText(`${i18nextInstance.t('errors.form.duplicateURL')}`)).toBeInTheDocument();
  });

  test('parsing rss', async () => {
    nock(getProxyHost())
      .get(getProxyPath(urls.invalid))
      .reply(200, rss.invalid, { 'Access-Control-Allow-Origin': '*' });

    userEvent.type(screen.getByRole('textbox', { name: 'url' }), urls.invalid);
    userEvent.click(screen.getByRole('button', { name: 'add' }));

    expect(await screen.findByText(`${i18nextInstance.t('errors.app.rssParser')}`)).toBeInTheDocument();
  });

  test('network error', async () => {
    nock(getProxyHost())
      .get(getProxyPath(urls.invalid))
      .reply(400, '', { 'Access-Control-Allow-Origin': '*' });

    userEvent.type(screen.getByRole('textbox', { name: 'url' }), urls.invalid);
    userEvent.click(screen.getByRole('button', { name: 'add' }));

    expect(await screen.findByText(`${i18nextInstance.t('errors.app.network')}`)).toBeInTheDocument();
  });
});

describe('check base UI logic', () => {
  test('form is disabled while submitting', async () => {
    nock(getProxyHost())
      .persist()
      .get(getProxyPath(urls.hexlet))
      .reply(200, '', { 'Access-Control-Allow-Origin': '*' });

    expect(screen.getByRole('textbox', { name: 'url' })).not.toHaveAttribute('readonly');
    expect(screen.getByRole('button', { name: 'add' })).toBeEnabled();

    userEvent.type(screen.getByRole('textbox', { name: 'url' }), urls.hexlet);
    userEvent.click(screen.getByRole('button', { name: 'add' }));

    expect(screen.getByRole('textbox', { name: 'url' })).toHaveAttribute('readonly');
    expect(screen.getByRole('button', { name: 'add' })).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'url' })).not.toHaveAttribute('readonly');
      expect(screen.getByRole('button', { name: 'add' })).toBeEnabled();
    });
  });

  test('can add new feeds', async () => {
    nock(getProxyHost())
      .persist()
      .get(getProxyPath(urls.hexlet))
      .reply(200, rss.hexlet, { 'Access-Control-Allow-Origin': '*' });

    nock(getProxyHost())
      .persist()
      .get(getProxyPath(urls.devTo))
      .reply(200, rss.devTo, { 'Access-Control-Allow-Origin': '*' });

    const firstFeedPost = hexletPosts[0];
    const secondFeedPost = devToPosts[0];

    userEvent.type(screen.getByRole('textbox', { name: 'url' }), urls.hexlet);
    userEvent.click(screen.getByRole('button', { name: 'add' }));

    expect(await screen.findByText(`${i18nextInstance.t('messages.app.addRSS')}`)).toBeInTheDocument();

    expect(screen.getByText(firstFeedTitle)).toBeInTheDocument();
    expect(screen.getByText(firstFeedDescription)).toBeInTheDocument();
    expect(screen.getByText(firstFeedPost.title)).toBeInTheDocument();

    userEvent.type(screen.getByRole('textbox', { name: 'url' }), urls.devTo);
    userEvent.click(screen.getByRole('button', { name: 'add' }));

    expect(await screen.findByText(`${i18nextInstance.t('messages.app.addRSS')}`)).toBeInTheDocument();

    expect(screen.getByText(secondFeedTitle)).toBeInTheDocument();
    expect(screen.getByText(secondFeedDescription)).toBeInTheDocument();
    expect(screen.getByText(secondFeedPost.title)).toBeInTheDocument();

    const feedListItems = within(screen.getByTestId('feeds')).getAllByRole('listitem');
    const postsListItems = within(screen.getByTestId('posts')).getAllByRole('listitem');

    expect(feedListItems).toHaveLength(2);
    expect(postsListItems).toHaveLength(4);

    expect(within(feedListItems[0]).getByText(secondFeedTitle)).toBeInTheDocument();
    expect(within(postsListItems[0]).getByText(secondFeedPost.title)).toBeInTheDocument();
  });

  test('mark a post as read', async () => {
    nock(getProxyHost())
      .persist()
      .get(getProxyPath(urls.hexlet))
      .reply(200, rss.hexlet, { 'Access-Control-Allow-Origin': '*' });

    const postsContainer = screen.getByTestId('posts');

    userEvent.type(screen.getByRole('textbox', { name: 'url' }), urls.hexlet);
    userEvent.click(screen.getByRole('button', { name: 'add' }));

    const previewButtons = await within(postsContainer).findAllByText(`${i18nextInstance.t('buttons.postPreview')}`);

    const firstPostButton = previewButtons[0];
    const firstPost = hexletPosts[0];

    expect(within(postsContainer).getByText(firstPost.title)).not.toHaveClass('fw-normal');

    userEvent.click(firstPostButton);

    expect(await within(postsContainer).findByText(firstPost.title)).toHaveClass('fw-normal');
  });

  test('post preview with correct data', async () => {
    nock(getProxyHost())
      .persist()
      .get(getProxyPath(urls.hexlet))
      .reply(200, rss.hexlet, { 'Access-Control-Allow-Origin': '*' });

    const postsContainer = screen.getByTestId('posts');
    const postPreviewModal = screen.getByTestId('postPreviewModal');

    userEvent.type(screen.getByRole('textbox', { name: 'url' }), urls.hexlet);
    userEvent.click(screen.getByRole('button', { name: 'add' }));

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
  });
});
