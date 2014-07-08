var assert = require('assert')
  , join = require('path').join
  , getPliers = require('./fixtures/get-pliers')

describe('pliers.js', function () {

  describe('filesets()', function () {
    var pliers = getPliers()

    it('should throw if identifier is missing', function () {
      (function () {
        pliers.filesets()
      }).should.throwError('Fileset id must not be empty and only contain [a-Z]')
    })

    it('should throw if file pattern is missing', function () {
      (function () {
        pliers.filesets('js')
      }).should.throwError('A file pattern is required to define a file set')
    })

    describe('filesets.{id}', function () {
      it('should equal undefined if identifier is unknown', function () {
        assert.strictEqual(pliers.filesets.js, undefined)
      })

      it('should return an array of matching files', function () {
        pliers.filesets('js', __dirname + '/../*.js')

        assert.deepEqual(pliers.filesets.js
          , [ 'pliers-cli.js'
            , 'pliers.js'
            ].map(function (value) {
              return join(__dirname, '..', value)
            }))
      })

      it('should not have dedups same include patterns is passed twice ', function () {
        pliers.filesets('dup', [ __dirname + '/../*.js', __dirname + '/../*.js' ] )

        assert.deepEqual(pliers.filesets.dup
          , [ 'pliers-cli.js'
            , 'pliers.js'
            ].map(function (value) {
              return join(__dirname, '..', value)
            }))
      })

      it('should not have dedups if different patterns match the same file ', function () {
        pliers.filesets('dupTwo', [ __dirname + '/../*.js', __dirname + '/../*.js*' ] )

        assert.deepEqual(pliers.filesets.dupTwo
          , [ 'package.json'
            , 'pliers-cli.js'
            , 'pliers.js'
            ].map(function (value) {
              return join(__dirname, '..', value)
            }))
      })

      it('should return an array of matching files from an array of patterns', function () {

        pliers.filesets('allJs', [ __dirname + '/../*.js', __dirname + '/*.js' ])
        pliers.filesets.allJs.should.eql(
          [ 'pliers-cli.js'
          , 'pliers.js' ].map(function (value) {
            return join(__dirname, '..', value)
          }).concat(
            [ 'pliers-cli.test.js'
            , 'pliers.filesets.test.js'
            , 'pliers.load.test.js'
            , 'pliers.test.js' ].map(function (value) {
              return join(__dirname, '../test/', value)
            })
          ))
      })

      it('should return the same thing on each access', function () {
        pliers.filesets('everything', __dirname + '**')
        assert.deepEqual(pliers.filesets.everything, pliers.filesets.everything)
      })

      it('should allow a 3rd parameter to define exclude patterns', function () {
        pliers.filesets('nothing', __dirname + '**', __dirname + '**')
        assert.deepEqual(pliers.filesets.nothing, [])
      })

      it('should allow exclude patterns to be an array', function () {
        pliers.filesets('excludeArray', __dirname + '/*.js'
          , [ __dirname + '/*.load.test.js', __dirname + '/*-cli.test.js' ])

        assert.equal(pliers.filesets.excludeArray[1], join(__dirname, '../test/', 'pliers.test.js'))
      })

    })
  })

})
