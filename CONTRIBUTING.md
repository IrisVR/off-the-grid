## Contributing

If you'd like to contribute, please make a pull request to the `develop` branch for review. We are using [semantic-release](https://github.com/semantic-release/semantic-release) and [commitizen](https://github.com/commitizen/cz-cli) to help our workflow.

### Setup

```
$ git clone https://github.com/IrisVR/off-the-grid.git
$ cd off-the-grid
$ npm install
```

### Linting

We are using [eslint](https://github.com/eslint/eslint) with [airbnb-style-guide](https://github.com/airbnb/javascript) as base guide. To run the lint, simply run:

```
$ npm run lint
```

### Testing

We are using [mocha](https://github.com/mochajs/mocha), [chai](https://github.com/chaijs/chai) and [sinon](https://github.com/sinonjs/sinon) for testing.  Unit tests are contained in `test` folder. 

Run unit tests once

```
$ npm test
```

Run tests on file change

```
$ npm run test:watch
```

### Code Coverage

Using [nyc](https://github.com/istanbuljs/nyc) and [codecov](http://codecov.io/) for our code coverage tools. Tests are included to be run in in this command.

```
$ npm run coverage
```

### All of Above

We can run lint, test and code coverage with this command:

```
$ npm run validate
```

This script uses [npm-run-all] under the hood to execute the processes simultaneously.

---

### Commit

The module uses [commitizen](https://github.com/commitizen/cz-cli) for making commits, which is included in the dev dependencies. When you want to commit, instead of `git commit`, run `npm run commit`.

So for example:

```
$ git add -A
$ npm run commit
```

This will prompt a CLI to walk you through the changes you made. *Only a commit type of `feat` or `fix` will trigger an update to the published npm module;* other types such as `refactor` and `style` will not be a release as they don't change anything from the user's perspective.

Committing will run a githook that triggers `npm run validate`, which in turn runs `npm run lint` and `npm run coverage` in parallel. If there is an error at any stage, the commit will be rejected.

### Publish

Once a PR is merged into `develop`, CircleCI will ensure that the codebase is properly tested, linted and covered.

In the case where `develop` is merged into `master`, CircleCI will additionally create a release build, make a new tag according to the nature of the update (major, minor or patch), and auto-release the new version to npm.

## ToDo

Increase coverage tests to be 100%
