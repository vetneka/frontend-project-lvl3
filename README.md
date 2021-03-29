[![Actions Status](https://github.com/vetneka/frontend-project-lvl2/workflows/hexlet-check/badge.svg)](https://github.com/vetneka/frontend-project-lvl2/actions/workflows/hexlet-check.yml)
[![Build Status](https://github.com/vetneka/frontend-project-lvl2/workflows/build/badge.svg)](https://github.com/vetneka/frontend-project-lvl2/actions/workflows/build.yml)
[![Maintainability](https://api.codeclimate.com/v1/badges/2aa3bdec005def0a5cf8/maintainability)](https://codeclimate.com/github/vetneka/frontend-project-lvl2/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/2aa3bdec005def0a5cf8/test_coverage)](https://codeclimate.com/github/vetneka/frontend-project-lvl2/test_coverage)

# RSS Agregator 
> study project at hexlet.io

<br>

**gendiff** is a cli-util that allows you to compare two config-files (.yml or .json) and display the calculated difference between them in "stylish", "plain" or "json" format. 
<br>

| Step, № | Description                      | Asciinema                               |
|---------| ---------------------------------|:---------------------------------------:|
| `3`     | Comparison of flat files (JSON)  | [link](https://asciinema.org/a/388166)  |
| `5`     | Comparison of flat files (YML)   | [link](https://asciinema.org/a/388393)  |
| `6`     | Stylish formatter                | [link](https://asciinema.org/a/389284)  |
| `7`     | Plain formatter                  | [link](https://asciinema.org/a/389699)  |
| `8`     | Json formatter                   | [link](https://asciinema.org/a/389842)  |

# Installation and Usage
### Prerequisites:
```
node.js >= 14
npm >= 6
make >= 4
```

You can install **gendiff** using *make*:
```
$ make setup      // install dependencies
$ make install    // install cli
```
After that, you can run **gendiff** like this:
```
$ gendiff [options] <filepath1> <filepath2>

Options:
  -V, --version        output the version number
  -f, --format [type]  output format (default: "stylish")
  -h, --help           display help for command
```
Supported file formats: **json, yml**

Supported output formats: **stylish, plain, json**

# Formats description
<details>
  <summary>Stylish format</summary>

  ```
  {
    common: {
        + follow: false
          setting1: Value 1
        - setting2: 200
        - setting3: true
        + setting3: null
        + setting4: blah blah
        + setting5: {
              key5: value5
          }
          setting6: {
              doge: {
                - wow: 
                + wow: so much
              }
              key: value
            + ops: vops
          }
      }
  }
  ```
</details>

<details>
  <summary>Plain format</summary>

  ```
  Property 'common.follow' was added with value: false
  Property 'common.setting2' was removed
  Property 'common.setting3' was updated. From true to null
  Property 'common.setting4' was added with value: 'blah blah'
  Property 'common.setting5' was added with value: [complex value]
  Property 'common.setting6.doge.wow' was updated. From '' to 'so much'
  ```
</details>

<details>
  <summary>Json format</summary>

  ```json
  [{"key":"common","type":"nested","children":[{"key":"follow","type":"added","prevValue":false},{"key":"setting1","type":"unchanged","prevValue":"Value 1"},{"key":"setting2","type":"removed","prevValue":200},{"key":"setting3","type":"changed","prevValue":true,"nextValue":null},{"key":"setting4","type":"added","prevValue":"blah blah"},{"key":"setting5","type":"added","prevValue":{"key5":"value5"}},{"key":"setting6","type":"nested","children":[{"key":"doge","type":"nested","children":[{"key":"wow","type":"changed","prevValue":"","nextValue":"so much"}]},{"key":"key","type":"unchanged","prevValue":"value"},{"key":"ops","type":"added","prevValue":"vops"}]}]}]
  ```
</details>

# Run tests
```
$ make test
// or
$ make test-coverage
```
