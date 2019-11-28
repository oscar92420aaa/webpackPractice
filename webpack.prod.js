const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const glob = require('glob');
const HtmlWebpackExternalsPlugin = require('html-webpack-externals-plugin');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const SpeedMeasureWebpackPlugin = require('speed-measure-webpack-plugin');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const TerserWebpackPlugin = require('terser-webpack-plugin');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin'); // 缓存插件-提高二次构建速度
const PurgecssPlugin = require('purgecss-webpack-plugin'); // trss-shaking css

const smp = new SpeedMeasureWebpackPlugin();

// trss-shaking css
const PATHS = {
    src: path.join(__dirname, 'src')
};

const setMPA = () => {
    const entry = {};
    const htmlWebpackPlugins = [];

    const entryFiles = glob.sync(path.join(__dirname, './src/*/index.js'));
    // '/Users/liuyang/Desktop/myProject/webpackPractice/src/index/index.js'

    Object.keys(entryFiles).map((index) => {
        const entryFile = entryFiles[index];
        const match = entryFile.match(/src\/(.*)\/index\.js/); // TODO
        const pageName = match && match[1];

        entry[pageName] = entryFile;
        htmlWebpackPlugins.push( // TODO
            new HtmlWebpackPlugin({
                // inlineSource: '.css$',
                template: path.join(__dirname, `src/${pageName}/index.html`),
                filename: `${pageName}.html`,
                chunks: ['commons', pageName],
                inject: true,
                minify: {
                    html5: true,
                    collapseWhitespace: true,
                    preserveLineBreaks: false,
                    minifyCSS: true,
                    minifyJS: true,
                    removeComments: false
                }
            })
        );        
    });

    return {
        entry,
        htmlWebpackPlugins
    };
}

const { entry, htmlWebpackPlugins } = setMPA();

module.exports = smp.wrap({
    entry: entry,
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name]_[chunkhash:8].js'
    },
    mode: 'production',
    resolve: { // 提高构建速度
        alias: {
            'react': path.resolve(__dirname, './node_modules/react/umd/react.production.min.js'),
            'react-dom': path.resolve(__dirname, './node_modules/react-dom/umd/react-dom.production.min.js'),            
        },
        extensions: ['.js'],
        mainFields: ['main'] // 查找package.json里面的main字段  
    },
    module: {
        rules: [
            {
                test: /.js$/,
                use: [
                    {
                        loader: 'thread-loader', // 多进程-构建速度优化
                        options: {
                            workers: 3
                        }
                    },
                    'babel-loader',
                    'eslint-loader'
                ]
            },
            {
                test: /.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader'
                ]
            },
            {
                test: /.less$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'less-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins: () => [
                                require('autoprefixer')({
                                    browsers: ['last 2 version', '>1%', 'ios 7']
                                })
                            ]
                        }
                    },
                    {
                        loader: 'px2rem-loader',
                        options: {
                            remUnit: 75,
                            remPrecision: 8
                        }
                    },                    
                ]
            },
            // {
            //     test: /.(png|jpg|gif|jpeg)$/,
            //     use: [
            //         'file-loader'
            //     ]
            // },
            {
                test: /.(woff|woff2|eot|ttf|otf)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name]_[hash][ext]'
                        }
                    }
                ]              
            },
            {
                test: /.(png|jpg|gif|jpeg)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name]_[hash][ext]'
                        }
                    }
                ]
            },             
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            filename: '[name]_[contenthash:8].css'
        }),
        new OptimizeCSSAssetsPlugin({
            assetNameRegExp: /\.css$/g,
            cssProcessor: require('cssnano')
        }),
        // new HtmlWebpackExternalsPlugin({ // 分离基础包-引入cdn-构建速度优化
        //     externals: [
        //       {
        //         module: 'react',
        //         entry: 'https://11.url.cn/now/lib/16.2.0/react.min.js',
        //         global: 'React',
        //       },
        //       {
        //         module: 'react-dom',
        //         entry: 'https://11.url.cn/now/lib/16.2.0/react-dom.min.js',
        //         global: 'ReactDOM',
        //       },
        //     ]
        // }), 
        new FriendlyErrorsWebpackPlugin(), // 构建日志优化提示插件
        function() { // 主动捕获并处理构建错误-webpack4
            this.hooks.done.tap('done', (stats) => {
                if (stats.compilation.errors && stats.compilation.errors.length 
                    && process.argv.indexOf('--watch') == -1)
                {
                    console.log('build error');
                    process.exit(1);
                }
            })
        },
        // new BundleAnalyzerPlugin() // 打包体积可视化插件 
        new webpack.DllReferencePlugin({ // webpack进一步分包-预编译资源模块-提高构建速度
            manifest: require('./build/library/library.json')
        }), 
        new HardSourceWebpackPlugin(),  // 缓存插件-提高二次构建速度 
        new PurgecssPlugin({ // tree-shaking css
            paths: glob.sync(`${PATHS.src}/**/*`,  { nodir: true }),
        })                   
    ].concat(htmlWebpackPlugins),
    devtool: 'source-map',
    // optimization: { // 分离公共基本包
    //     splitChunks: {
    //         cacheGroups: {
    //             commons: {
    //                 test: /(react | react-dom)/,
    //                 name: 'vendors', 
    //                 chunks: 'all',
    //             }
    //         }
    //     }
    // } 
    optimization: { // 分离公共文件
        splitChunks: {
            minSize: 0, // 文件大小大于0
            cacheGroups: {
                commons: {
                    name: 'commons',
                    chunks: 'all',
                    minChunks: 2 // 文件引用次数是两次
                }
            }
        },
        minimizer: [
            new TerserWebpackPlugin({ // 加快构建速度-多线程多实例压缩代码
                parallel: true,
                cache: true
            })
        ]        
    },
    stats: 'errors-only' // webpack构建日志优化       
});