const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: {
        library: [
            'react',
            'react-dom'
        ]
    },
    output: {
        filename: '[name]_[chunkhash].dll.js', // 这时候打包出来叫library.dll.js
        path: path.join(__dirname, 'build/library'), // 放在dist里面，打包时候会清除dist
        library: '[library]'
    },
    plugins: [
        new webpack.DllPlugin({
            name: '[name]_[hash]',
            path: path.join(__dirname, 'build/library/[name].json')
        })
    ]
};