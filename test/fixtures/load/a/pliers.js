module.exports = function (pliers) {

  pliers.filesets('js', ['*.js'])

  pliers('fixture', function () {
    pliers.logger.info('fixture a')
  })

  pliers('a', function (done) {
    pliers.logger.info('a')
    done()
  })

  pliers('b', function (done) {
    pliers.callOrder.push(2)
    pliers.logger.info('b')
    done()
  })

  // pliers.watch(
  //   pliers.filesets.js, function () {
  //     pliers.emit('jsChanged', pliers.filesets.js)
  //   })
}