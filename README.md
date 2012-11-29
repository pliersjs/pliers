# pilers - A build tool

[![build status](https://secure.travis-ci.org/serby/pilers.png)](http://travis-ci.org/serby/pilers)

## Installation

      npm install -g pilers

## Introduction

Pliers is a build tool that tries really hard to do as little as possible. It
does however do three things and it is unlikely to grow beyond that.

## Features

### Filesets

Define lists of files to perform operations on

### Watches

Watches a file or fileset for change and performs an action once something
changes.

### Runs tasks in sub-projects

This is really important for us, and the reasons why we wrote Pliers. Here is an
example: TBC

## FAQ

### Is there a plugin system?

Yes it's called **require**

### Why bother making a new build tool, what is wrong with make

make is an amazing tool, but sometimes you need to do more that just run
scripts and create folders. Sometimes a little project context is useful at
build time and based on that assumption plier aims to allow that.

## Usage

      Usage: pliers [options] [task]

      Options:
        -h, --help     output usage information
        -V, --version  output the version number
        -l, --list     List all available tasks with descriptions
        -b, --bare     List task names only

## Credits
* [Paul Serby](https://github.com/serby/) follow me on twitter [@serby](http://twitter.com/serby)
* Built for use at [Clock Limited](http://www.clock.co.uk)

## Licence
Licensed under the [New BSD License](http://opensource.org/licenses/bsd-license.php)