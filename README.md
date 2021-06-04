[![Actions Status](https://github.com/vetneka/frontend-project-lvl3/workflows/hexlet-check/badge.svg)](https://github.com/vetneka/frontend-project-lvl3/actions/workflows/hexlet-check.yml)
[![Build Status](https://github.com/vetneka/frontend-project-lvl3/workflows/build/badge.svg)](https://github.com/vetneka/frontend-project-lvl3/actions/workflows/build.yml)
[![Maintainability](https://api.codeclimate.com/v1/badges/61b1d82146e8b9eea44c/maintainability)](https://codeclimate.com/github/vetneka/frontend-project-lvl3/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/61b1d82146e8b9eea44c/test_coverage)](https://codeclimate.com/github/vetneka/frontend-project-lvl3/test_coverage)

# RSS Reader
> study project at hexlet.io

# Overview
[RSS Reader](https://frontend-project-lvl3-vetneka.vercel.app/) is a service for aggregating RSS feeds. It allows you to add an unlimited number of RSS feeds, updates them and adds new entries to the general stream.

<p align="center">
  <img src="https://s225vla.storage.yandex.net/rdisk/f0d9f2add26514b8fd1ed211c1b9ad6ef35cd3ce658595e7c2d7690683293425/60b9ea55/bXVnV3uO7QCHjm5JlPKCOkt1DjjKyq6dZPnW-vnL0OFyzxtEiXgZfkt35TN0qR0q_onf_evkDWB2Xovb70hdeA==?uid=75561265&filename=hexlet-frontend-3.png&disposition=inline&hash=&limit=0&content_type=image%2Fpng&owner_uid=75561265&fsize=70781&hid=bcc970f85b11bb346a4e174889de1020&media_type=image&tknv=v2&etag=88d9deea8048cdbf95b9a51c2586099a&rtoken=fZaRCH3e02P8&force_default=yes&ycrid=na-2ea8676cfb63b7e3c84a8ce647478e68-downloader9f&ts=5c3ecd7df7f40&s=7058847e268b419cc43d0c87f5dec730beff69184c5c00f81c6eb848e958f8bc&pb=U2FsdGVkX19wemg8g02IY4sugjT0GvlSHsc9_UaYi17K94h0I91Yl4cQgZrQpnBZt8DjhmuNPO1bToHO4g3Dc1QDtWn2I0O_HGwiomYftLs" width="50%">
</p>

## Used technologies
JavaScript: [yup](https://github.com/jquense/yup), [axios](https://github.com/axios/axios), [onChange](https://github.com/Qard/onchange), [i18next](https://www.i18next.com/), promises (native)

CI/CD: [vercel](https://vercel.com/), [codeclimate](https://codeclimate.com/), [github actions](https://github.com/vetneka/frontend-project-lvl3/actions)

Tests: [jest](https://jestjs.io/), [@testing-library](https://testing-library.com/)

Bundler: [webpack](https://webpack.js.org/)

Layout: [bootstrap 5](https://getbootstrap.com/)

## Features

- [x] Form
  - used by [yup](https://github.com/jquense/yup) to analyze and validate input value
  - unsupervised
- [x] UX
  - form blocked during submission
  - error handling (possible errors):
    - 'Поле не должно быть пустым'
    - 'Ссылка должна быть валидным URL'
    - 'RSS уже существует'
    - 'Ошибка сети'
    - 'Ресурс не содержит валидный RSS'
  - success handling (possible messages):
    - 'RSS успешно загружен'
- [x] Post preview
  - click on the "View" button opens a modal window with a description of the post
  - link of the post is marked as visited
  - used [bootstrap modal component](https://getbootstrap.com/docs/5.0/components/modal/)

- [x] Subscribing to news feed
  - AJAX ([axios](https://github.com/axios/axios)) is used to periodically (once every 5 seconds) poll the added feeds for new posts

# Installation and Usage
### Prerequisites:
```
node.js >= 14
npm >= 6
make >= 4
```

### Online:
[RSS Reader (demo)](https://frontend-project-lvl3-vetneka.vercel.app/)

RSS feed with interval updated:

`http://lorem-rss.herokuapp.com/feed?unit=second&interval=5`

### Offline
```
$ git clone git@github.com:vetneka/frontend-project-lvl3.git
$ make install
$ make develop
```

# Run tests
```
$ make test

$ make test-coverage
```
