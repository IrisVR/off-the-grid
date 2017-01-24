# Off the Grid

[![CircleCI](https://img.shields.io/circleci/project/github/IrisVR/off-the-grid.svg?style=flat-square)](https://circleci.com/gh/IrisVR/off-the-grid)
[![Codecov](https://img.shields.io/codecov/c/github/IrisVR/off-the-grid.svg?style=flat-square)](https://codecov.io/gh/IrisVR/off-the-grid)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

When using 3rd party data analytics service in an offline capable app such as when using Electron, constant internet connection is required to keep sending data to the analytics service. When the internet connection drops out, we can't send data to the service, resulting in data loss. 

__Off the Grid__ is designed to handle this scenario. The basic idea is, __Off the Grid__ will cache the data when our app is offline and will replay the data back when our app is online.

1. [Getting Started](#getting-started)
2. [Error Table](#error-table)
3. [API](#api)
4. [Testing](#testing)
5. [Contribution](#contribution)

Compatible with Node.js + Express apps, with an optional MongoDB backend.

---

## Getting Started
### Installation

```sh
$ npm install --save off-the-grid 
```

### Usage

Example usage with analytics in Electron app:

```js
// makeAnalyticsOfflineCapable.js

const electron = require("electron");
const analytics = require("your-favorite-analytics-library");
const OffTheGrid = require("off-the-grid");

let offTheGrid;

const { ipcMain } = electron;

ipcMain.on("prepareAnalytics", (event, isOnline) => {
  initializeOffTheGridAnalytics(isOnline);
});

ipcMain.on('netStatus', (event, data) => {
  if (data === "online")
    offTheGrid.setOnline();
  else if (data === "offline")
    offTheGrid.setOffline();
})

ipcMain.on('actions', (event, data) => {
  offTheGrid.record(data.type, data.content);
})

function initializeOffLineAnalytics(isOnline) {
  offTheGrid = new OffTheGrid({
    logFilePath: "pathToLogFile.log",
    interval: (1000 * 60 * 30),
    isOnline: isOnline,               
    replayImmediately: true,           
    callback: (data) => {
      // Do something with the data here
      analytics.track(data);
    }
  });
}
```

### API
### Constructor

`new OffTheGrid(opts)`

Instantiates a new `OffTheGrid` object, with `opts`:

* `logFilePath`

  Path to log file. Make sure the parent folders are created prior.

* `interval`

  Time interval specified in miliseconds to replay the cached data and give it to the callback.

* `isOnline`

  Current status of internet connection.

* `replayImmediately`

  Whether to replay the cached data immediately after instantiation.

* `callback(data) {}`

  Callback to be called when replaying each cached data. This library is using [winston](https://github.com/winstonjs/winston) to help logging the data. For each replayed data, there are additional informations that is `winston` related (e.g., timestamp).

### Methods

* `setOffline()`

  Update the current status of internet connection to offline.

* `setOnline()`

  Update the current status of internet connection to online.

* `record(message, body)`

  Record data. `message` is `String` and `body` is `JSON`.

---

## Testing

Unit tests are contained in `/test`. Please use `_mock` as mock folder for testing anything file related. Make sure to install all dev dependencies required for the testing environment.

```sh
$ git clone https://github.com/IrisVR/off-the-grid.git
$ cd off-the-grid
$ npm install
```

### Linting

```
$ npm run lint
```

### Running tests

Run unit tests once

```
$ npm test
```

Run tests on file change

```
$ npm run test:watch
```

### Code coverage

```
$ npm run coverage
```

### All of the above

```
$ npm run validate
```

This script uses `npm-run-all --parallel` under the hood to execute the processes simultaneously.

---

## Contributing

If you'd like to contribute, please make a pull request to the `develop` branch for review.

### Committing and Releasing

To release updates, you must be part of the [IrisVR NPM Organization](https://www.npmjs.com/org/irisvr).

### Preview

To preview the contents of the npm module prior to publishing:

```
$ npm pack
```

This will create the tar zip file that would be served by npm. You can unzip it and explore its contents, which should consist of the following:
```
dist/
LICENSE
README.md
package.json
```

When the module is require'd, `package.json` will point the user to the relevant entry point at `dist/index.js`.

### Commit

The module uses [commitizen](https://github.com/commitizen/cz-cli) for making commits, which is included in the dev dependencies.

```
$ git add -A
$ npm run commit
```

This will prompt a CLI to walk you through the changes you made. *Only a commit type of `feat` or `fix` will trigger an update to the published npm module;* other types such as `refactor` and `style` will not be a release as they don't change anything from the user's perspective.

Committing will run a githook that triggers `npm run validate`, which in turn runs `npm test`, `npm run lint` and `npm run coverage` in parallel. If there is an error at any stage, the commit will be rejected.

### Publish

Once a PR is merged into `develop`, CircleCI will ensure that the codebase is properly tested, linted and covered.

In the case where `develop` is merged into `master`, CircleCI will additionally create a release build, make a new tag according to the nature of the update (major, minor or patch), and auto-release the new version to npm.

## TODO
Coverage ttest 100%
