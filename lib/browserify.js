const browserify = require('browserify')
const watchify = require('watchify')
const fs = require('fs')
const path = require('path')
const concat = require('concat-stream')

module.exports = ({ watch }) => {
  const opts = {
    insertGlobals: true,
    ignoreMissing: true,
    builtins: false,
    browserField: false,
    insertGlobalVars: {
      '__dirname': (file, basedir) => {
        return '__dirname + "/" + ' +
          JSON.stringify(path.dirname(path.relative(basedir, file)))
      },
      '__filename': (file, basedir) => {
        return '__dirname + "/" + ' +
          JSON.stringify(path.relative(basedir, file))
      },
      'process': undefined,
      'global': undefined,
      'Buffer': undefined,
      'Buffer.isBuffer': undefined
    },
    postFilter: (id, file, pkg) => {
      if (!file) return false
      file = path.relative(path.join(__dirname, '..'), file)
      if (file.indexOf('node_modules') > -1 && file.indexOf('sheetify') === -1) {
        return false
      }
      return true
    }
  }

  if (watch) {
    opts.cache = {}
    opts.packageCache = {}
    opts.plugin = [watchify]
  }

  const b = browserify(`${__dirname}/../app.js`, opts)

  b.transform('envify')
  b.transform('sheetify/transform', { use: ['sheetify-nested'] })

  const bundle = () => {
    process.stderr.write(`${new Date()} bundling...`)

    b.bundle().pipe(concat(js => {
      fs.writeFile(`${__dirname}/../bundle.js`, js, err => {
        if (err) throw err
        process.stderr.write('ok!\n')
      })
    }))
  }

  b.on('update', bundle)
  bundle()
  return b
}