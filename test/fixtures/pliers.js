module.exports = tasks

function tasks(pliers) {

  pliers('greet', function (done) {
    pliers.logger.info('hello from pliers.js')
    done()
  })

}