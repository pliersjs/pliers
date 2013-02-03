# pliers - A buildy, watchy type tool

[![build status](https://secure.travis-ci.org/serby/pliers.png)](http://travis-ci.org/serby/pliers)

## Installation

      npm install -g pliers

## Introduction

Pliers allows you to use JavaScript to write your build tasks like you would
your applications. It has three key features include/exclude filesets, dependency resolution,
and file watching.

## FAQ

### Why bother making a new build tool, what is wrong with make?

make is an great tool, but sometimes you need to do more that just run scripts
and create folders. Sometimes it is handy to have a little project context when
doing build tasks. pliers is all JavaScript so you can use your existing code
and npm modules.

### Why not just make a node.js script for build tasks that need then and call them from make?

That is a good method and will work for many projects. But you are splitting an
activity over two languages as soon there is a little bit of complexity it makes
maintenance, debugging and knowledge transfer harder. Having a structured build
system with a minimal but useful feature set certainly solves problems for us at
Clock.

### Is there a plugin system?

Yes it's called **require()**

## CLI Usage

    Usage: pliers [options] [task]

    Options:
      -h, --help                                          output usage information
      -V, --version                                       output the version number
      -t, --tasks [file]                                  A file with user defined tasks (Default: ./pliers.js)
      -l, --list                                          List all available tasks with descriptions
      -b, --bare                                          List task names only
      -a, --all                                           Run all named tasks with in the current tree
      -L, --logLevel [trace|debug|info|warn|error|fatal]  Set the level of logs to output

## pliers.js

Running pliers will look for a pliers.js in the current working directory.

### Tasks

```js
module.exports = function (pliers) {

  pliers('hello', function (done) {
    pliers.logger.info('Hello world')
    done()
  })

}
```

To run the hello task from the command line:

     pliers hello


#### Dependencies

Pliers will resolve and run all dependencies before executing the task

```js

pliers('test', function (done) {
  pliers.exec('npm test', done)
})

pliers('lint', { description: 'Run jshint all on project JavaScript' }, function (done) {
  pliers.exec('jshint lib test', done)
})

pliers('qa', 'test', 'lint')
```

This will run test task and then the lint task.

     pliers qa

### API

Pliers is not very opinionated and has very little API surface area. That said there are a few built in functions.

#### exec(command)

Executes command using require('child_process').spawn and returns the
ChildProcess.

```js

pliers('list', function (done) {
  pliers.exec('ls', done)
})

```

#### run(taskName)

Run another pliers task.

```js

pliers('runner', function (done) {
  pliers.run('list', done)
})

```

#### load(folder)

Load another pliers project into a parent. This is useful if you have standalone
sub projects.

```js

pliers.load('./subproject')

```

You can then run sub project tasks from the parent using the -A option.

#### runAll(taskName)

Run all pliers task for any loaded sub pliers project.

```js

pliers('build', function (done) {
  pliers.runAll('build', done)
})

```

     pliers build

This will build all the sub project build tasks


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

#### watch()


```js

// Run the unit tests whenever a JavaScript file changes
pliers('watchCss', function (done) {

  pliers.filesets('js', __dirname + '/*.js', __dirname + '/*.test.js')

  pliers('test', function (done) {
    pliers.exec('npm test', done)
  })

  pliers.watch(pliers.filesets.js, function() {
    pliers.run('test')
  })
})

```

## Credits
* [Paul Serby](https://github.com/serby/) follow me on twitter [@serby](http://twitter.com/serby)
* [Ben Gourley](https://github.com/bengourley/)
* [Dom Harrington](https://github.com/domharrington/)
* Built for use at [Clock Limited](http://www.clock.co.uk)

## Licence
Licensed under the [New BSD License](http://opensource.org/licenses/bsd-license.php)