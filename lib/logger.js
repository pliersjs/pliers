module.exports = Logger

var extend = require('lodash.assign')
  , util = require('util')
  , chalk = require('chalk')
  , levels =
    { 'trace': { rank: 1, color: 'bold' }
    , 'debug': { rank: 2, color: 'blue' }
    , 'info': { rank: 3, color: 'green' }
    , 'warn': { rank: 4, color: 'yellow' }
    , 'error': { rank: 5, color: 'red' }
    , 'fatal': { rank: 6, color: 'bgRed' }
    }

function Logger(options) {
  this.options = extend(
    { context: ''
    , level: 'info' }, options)

  this.contexts = []
  if (this.options.context) this.contexts.push(this.options.context)

  Object.keys(levels).forEach((function(level) {
    this[level] = this.writeLog.bind(this, level)
  }).bind(this))
}

Logger.prototype.writeLog = function() {
  var args = Array.prototype.slice.call(arguments)
    , level = args.shift()
    , logLevel = levels[this.options.level] ? levels[this.options.level].rank : 999
  if (levels[level].rank < logLevel) return
  process.stdout.write(chalk.dim((new Date()).toLocaleTimeString()) + ' '
    + chalk[levels[level].color](level) + ' '
    + (this.contexts.length > 0 ? chalk.cyan(this.contexts.join(':')) + ' ' : '')
    + util.format.apply(null, args) + '\n')
}

Logger.prototype.pushContext = function(context) {
  this.contexts.push(context)
}

Logger.prototype.popContext = function() {
  this.contexts.pop()
}
