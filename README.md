# pliers - A build tool

[![build status](https://secure.travis-ci.org/serby/pliers.png)](http://travis-ci.org/serby/pliers)

## Installation

      npm install -g pliers

## Introduction

Pliers is a build tool that tries really hard to do as little as possible. This
allows you to use JavaScript to write your build tasks like you would your
applications.

## FAQ

### Is there a plugin system?

Yes it's called **require()**

### Why bother making a new build tool, what is wrong with make

make is an amazing tool, but sometimes you need to do more that just run scripts
and create folders. Sometimes it is handy to have a little project context when
doing build tasks. pliers is all JavaScript so you can use your existing code
and npm modules.

## CLI Usage

      Usage: pliers [options] [task]

      Options:
        -h, --help     output usage information
        -V, --version  output the version number
        -l, --list     List all available tasks with descriptions
        -b, --bare     List task names only

## pliers.js

Running pliers will look for a pliers.js in the current working directory.

### Tasks

```js
module.exports = function(pliers) {

  pliers('hello', function(done) {
    pliers.logger.info('Hello world')
    done()
  })

}
```

To run the hello task from the command line:

     pliers hello


#### Dependencies

```js

pliers('test', function(done) {
  pliers.exec('./node_modules/.bin/mocha -r should', done)
})

pliers('lint', { description: 'Run jshint all on project JavaScript' }, function(done) {
  pliers.exec('jshint lib test', done)
})

pliers('qa', 'test', 'lint')
```

This will run test task and then the lint task.

     pliers qa

### API

Pliers is not very opinionated and has very little API surface area. That said there are a few built in functions.

#### exec(command)

Executes command using require('child_process').exec

```js

pliers('list', function(done) {
  pliers.exec('ls', done)
})

```

#### run(taskName)

Run another pliers task.

```js

pliers('runner', function(done) {
  pliers.run('list')
})

```

#### watch()

TBC

#### filesets(id, includePatterns[, excludePatterns])

Create a fileset that can be used to perform tasks on. The following fileset example would return all `.js` files in the current directory, excluding those that end in `.test.js`.

```js

pliers.filesets('js', __dirname + '/*.js', __dirname + '/*.test.js')

```

`includePatterns` & `excludePatterns` can be either a string or an Array if you need multiple glob conditions.

Filesets are calculated using the [`node-glob`](https://github.com/isaacs/node-glob) module. The filesets are first generated when they are accessed, this is done using the `id` property as follows:

```js

console.log(pliers.filesets.js) // Will output the fileset with the id 'js'

```

## Credits
* [Paul Serby](https://github.com/serby/) follow me on twitter [@serby](http://twitter.com/serby)
* [Ben Gourley](https://github.com/bengourley/)
* [Dom Harrington](https://github.com/domharrington/)
* Built for use at [Clock Limited](http://www.clock.co.uk)

## Licence
Licensed under the [New BSD License](http://opensource.org/licenses/bsd-license.php)