#!/usr/bin/env node
var program = require('commander')
  , pliers = require('./lib/pliers')()
  , join = require('path').join
  , tasks

program
  .version(require('./package.json').version)
  .usage('[options] [task]')
  .option('-t, --tasks [file]'
        , 'A file with user defined tasks (Default: ./pliers.js')
  .option('-l, --list'
        , 'List all available tasks with descriptions')
  .option('-b, --bare'
        , 'List task names only')
  //.option('-j, --json', 'JSON logging')
  .parse(process.argv)

if (!program.tasks) {
  program.tasks = 'pliers.js'
}

try {
  tasks = require(join(process.cwd(), program.tasks))
} catch (e) {
  console.log('Could not load `' + program.tasks + '`')
  process.exit(1)
}

tasks(pliers)

var taskName = program.args[0]

if (program.bare) {

  Object.keys(pliers.tasks).forEach(function(taskname) {
    console.log(taskname)
  })

  process.exit()
}

if (program.list) {

  Object.keys(pliers.tasks).forEach(function(taskname) {

    console.log(taskname + (pliers.tasks[taskname].description ? (' - '+ pliers.tasks[taskname].description) : ''))
  })

  process.exit()
}

if (taskName === undefined) {
  if (pliers.hasDefault) {
    pliers.default()
    return process.exit()
  } else {
    console.log('No default task')
    return process.exit(3)
  }
}

if (!pliers.tasks[taskName]) {
  console.log('Task not found \'' + taskName + '\'')
  return process.exit(2)
}

pliers.tasks[taskName]()
