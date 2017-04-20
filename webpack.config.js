module.exports = {
  entry: './src/app.jsx',
  output: {
    path: __dirname + '/public',
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      {test: /\.jsx?/, loader:'babel-loader', exclude:/node_modules/},
      {test: /\.jsx/, loader:'babel-loader', exclude:/node_modules/}
    ]
  }
};
