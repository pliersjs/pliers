module.exports = tasks

function tasks(pliers) {

  pliers('greet', function (done) {
    pliers.logger.info('hello from tasks.js')
    done()
  })

}