#!/usr/bin/env node
var program = require('commander')
  , path = require('path')
  , tasks
  , pliers = require('./lib/pliers')

program
  .version(require('./package.json').version)
  .usage('[options] [task]')
  .option('-t, --tasks [file]'
        , 'A file with user defined tasks (Default: ./pliers.js)')
  .option('-l, --list'
        , 'List all available tasks with descriptions')
  .option('-b, --bare'
        , 'List task names only')
  .option('-a, --all'
        , 'Run all named tasks with in the current tree')
  .option('-L, --logLevel [trace|debug|info|warn|error|fatal]'
        , 'Set the level of logs to output')
  //.option('-j, --json', 'JSON logging')
  .parse(process.argv)

if (!program.tasks) {
  program.tasks = 'pliers.js'
}

pliers = pliers({ logLevel: program.logLevel })

try {
  tasks = require(path.resolve(program.tasks))
} catch (e) {

  // Detect if the error caught is the task file
  // failing to load, or a load-time error. Print
  // error message or rethrow accordingly.

  var re = new RegExp(program.tasks)
  if (e.code === 'MODULE_NOT_FOUND' && re.test(e.message)) {
    console.log('Could not load `' + program.tasks + '`')
    process.exit(1)
  } else {
    throw e
  }

}

tasks(pliers)

var taskName = program.args[0]

if (program.bare) {
  pliers.getAllTaskNames().forEach(function (taskName) {
    console.log(taskName)
  })

  process.exit()
}

if (program.list) {
  pliers.list()
  process.exit()
}

if (taskName === undefined) {
  if (pliers.hasDefault) {
    pliers.defaultTask()
    return process.exit()
  } else {
    console.log('No default task')
    return process.exit(3)
  }
}
var fn
if (program.all) {
  fn = pliers.runAll.bind(null, taskName)
} else {
  fn = pliers.run.bind(null, taskName)
}

fn(function (error) {
  if (error) {
    console.error(error)
  }
})