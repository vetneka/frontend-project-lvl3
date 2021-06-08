[![Actions Status](https://github.com/vetneka/frontend-project-lvl3/workflows/hexlet-check/badge.svg)](https://github.com/vetneka/frontend-project-lvl3/actions/workflows/hexlet-check.yml)
[![Build Status](https://github.com/vetneka/frontend-project-lvl3/workflows/build/badge.svg)](https://github.com/vetneka/frontend-project-lvl3/actions/workflows/build.yml)
[![Maintainability](https://api.codeclimate.com/v1/badges/61b1d82146e8b9eea44c/maintainability)](https://codeclimate.com/github/vetneka/frontend-project-lvl3/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/61b1d82146e8b9eea44c/test_coverage)](https://codeclimate.com/github/vetneka/frontend-project-lvl3/test_coverage)

# RSS Reader
> study project at hexlet.io

# Overview
[RSS Reader](https://frontend-project-lvl3-vetneka.vercel.app/) is a service for aggregating RSS feeds. It allows you to add an unlimited number of RSS feeds, updates them and adds new entries to the general stream.

<p align="center">
  <img src="https://downloader.disk.yandex.ru/preview/ff172ca31af9fd7e0367eacb85ac2e8857376ee9b6c72e3abe11abed940a4556/60bff6bb/08DZ4tkONbS9eb8BUi844CaZ1VWZ2UdgVHGqFoJsGZ2FPiSJswsbK3XbbvTsTSsdK87RVREwRjZ_Mz7pBZNoFQ%3D%3D?uid=0&filename=hexlet-frontend-3.png&disposition=inline&hash=&limit=0&content_type=image%2Fpng&owner_uid=0&tknv=v2&size=1294x637" width="50%">
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
