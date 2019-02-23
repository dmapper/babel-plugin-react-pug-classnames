import pluginTester from 'babel-plugin-tester'
import plugin from '../index'

pluginTester({
  plugin,
  pluginName: 'babel-plugin-react-pug-classnames',
  snapshot: true,
  pluginOptions: {
  },
  babelOptions: {
    babelrc: true,
    filename: 'index.js'
  },
  tests: [
    // TODO
  ]
})
