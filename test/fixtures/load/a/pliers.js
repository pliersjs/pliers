module.exports = function(pliers) {

  pliers.filesets('js', ['*.js'])

  pliers('fixture', function() {
    pliers.logger.info('fixture')
  })

  pliers('a', function() {
    pliers.logger.info('a')
  })

  // pliers.watch(
  //   pliers.filesets.js, function() {
  //     pliers.emit('jsChanged', pliers.filesets.js)
  //   })
}