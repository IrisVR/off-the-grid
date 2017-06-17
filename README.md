# Off the Grid

[![CircleCI](https://img.shields.io/circleci/project/github/IrisVR/off-the-grid.svg?style=flat-square)](https://circleci.com/gh/IrisVR/off-the-grid)
[![Codecov](https://img.shields.io/codecov/c/github/IrisVR/off-the-grid.svg?style=flat-square)](https://codecov.io/gh/IrisVR/off-the-grid)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

When using 3rd party data analytics service in an offline capable app such as when using Electron, constant internet connection is required to keep sending data to the analytics service. When the internet connection drops out, we can't send data to the service, resulting in data loss. 

__Off the Grid__ is designed to handle this scenario. The basic idea is, __Off the Grid__ will cache the data if our app is offline and will send the data if our app is online.

1. [Getting Started](#getting-started)
2. [API](#api)
3. [Contributing](#contributing)
4. [License](#license)

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

ipcMain.on("prepareAnalytics", (event) => {
  initializeOffTheGridAnalytics();
});

ipcMain.on('actions', (event, data) => {
  offTheGrid.record(data.type, data.content);
})

function initializeOffLineAnalytics() {
  offTheGrid = new OffTheGrid({
    logFilePath: "pathToLogFile.log",
    flushInterval: (1000 * 60 * 30),
    cacheSize: 10000000,                            // log file size of 10 MB
    checkConditionBeforeFlush: checkInternetConn(), // returns a promise
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

* `flushInterval`

  Time interval specified in miliseconds to replay the cached data and give it to the callback.

* `cacheSize`

  Maximum log file size. If it exceeds this size, the log file will be deleted on the next interval when at that time the condition is not satisfied.

* `checkConditionBeforeFlush`

  Function to check current status of internet connection.

* `replayImmediately`

  Whether to replay the cached data immediately after instantiation.

* `callback(data) {}`

  Callback to be called when replaying each cached data. 

### Methods

* `record(message, body)`

  Record data. `message` is `String` and `body` is `JSON`.

## Contributing

[CONTRIBUTING.md](https://github.com/IrisVR/off-the-grid/blob/master/CONTRIBUTING.md)

## License

[MIT](https://github.com/IrisVR/off-the-grid/blob/master/LICENSE)
