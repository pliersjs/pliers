module.exports = tasks

function tasks(pliers) {

  pliers.filesets('all', '**')

  pliers('greet', function (done) {
    pliers.logger.info('hello from pliers.js')
    done()
  })

  pliers('error', function (done) {
    pliers.logger.info('There will be an error')
    var fn
    fn()
    done()
  })

  pliers('erroneousWatch', function (done) {
    pliers.watch(['watched.txt'], function () {
      var fn
      fn()
      done()
    })
  })
}