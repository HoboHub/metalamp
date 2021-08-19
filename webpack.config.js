const path = require('path')
const fs = require('fs')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const OptimizeCssAssetWebpackPlugin = require('optimize-css-assets-webpack-plugin')
const TerserWebpackPlugin = require('terser-webpack-plugin')
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin')
// const { webpack } = require('webpack')
const webpack = require('webpack')


const isDev = process.NODE_ENV === 'development'
const isProd = !isDev

const filename = ext => isDev ? `[name].[contenthash].${ext}` : `[name].${ext}`

const optimization = () => {
    const configObj = {
        splitChunks: {
            chunks: 'all'
        }
    }

    if (isProd) {
        configObj.minimizer = [
            new OptimizeCssAssetWebpackPlugin(),
            new TerserWebpackPlugin()
        ];
    }

    return configObj
}

const PAGE_DIR_SRC = path.resolve(__dirname, './src/pages/')
const PAGES = fs.readdirSync(PAGE_DIR_SRC).filter(fileName => fileName.endsWith('.pug'))

// const PAGE_DIR_BLOCKS = path.resolve(__dirname, './src/blocks/')
// const BLOCKS = path.resolve(__dirname, './src/blocks/**/*.pug')
// const BLOCKS = fs.readdirSync(PAGE_DIR_BLOCKS).filter(fileName => fileName.endsWith('.pug'))

const plugins = () => {
    const basePlugins = [

        ...PAGES.map(
            page =>
                new HtmlWebpackPlugin({
                    title: 'Pug BEM',
                    template: `${PAGE_DIR_SRC}/${page}`,
                    filename: `./${page.replace(/\.pug/, '.html')}`,
                    minify: {
                        collapseWhitespace: isProd
                    }
                }),
        ),
        
        // set $ as a global variable for jquery
        new webpack.ProvidePlugin({
            $: "jquery",
            JQuery: "jquery"
        }),

        // ...BLOCKS.map(
        //     block =>
        //         new HtmlWebpackPlugin({
        //             template: `${PAGE_DIR_BLOCKS}/${block}`,
        //             filename: `./${block.replace(/\.pug/, 'html')}`,
        //         }),
        // ),

        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            filename: `./css/${filename('css')}`,
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, 'src/img'),
                    to: path.resolve(__dirname, 'dist/img')
                },
            ]
        })
    ]

    if (isProd) {
        basePlugins.push(
            new ImageMinimizerPlugin({
                minimizerOptions: {
                    plugins: [
                        ["gifsicle", { interlaced: true }],
                        ["jpegtran", { progressive: true }],
                        ["optipng", { optimizationLevel: 5 }],
                        [
                            "svgo",
                            {
                                plugins: [
                                    {
                                        name: "removeViewBox",
                                        active: false,
                                    },
                                    {
                                        name: "addAttributesToSVGElement",
                                        params: {
                                            attributes: [{ xmlns: "http://www.w3.org/2000/svg" }],
                                        },
                                    },
                                ],
                            },
                        ],
                    ], //
                },
            }),
        )
    }

    return basePlugins
}

module.exports = {
    context: path.resolve(__dirname, 'src'),
    mode: 'development',
    entry: {
        main: path.resolve(__dirname, './src/index.js'),
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: `./js/${filename('js')}`,
        assetModuleFilename: '[path]/[name].[ext]'
    },
    //
    resolve: {
        alias: {
            Fonts: path.resolve(__dirname, 'src/fonts'),
        }
    },
    //
    devServer: {
        historyApiFallback: true,
        contentBase: path.resolve(__dirname, './dist'),
        port: 4300,
        open: true,
        // hot: isDev
        compress: true,
    },
    optimization: optimization(),
    plugins: plugins(),
    devtool: isProd ? false : 'source-map',
    module: {
        rules: [
            {
                test: /\.pug$/,
                loader: 'pug-loader'
            },
            {
                test: /\.html$/,
                loader: 'html-loader',
                // use: [
                //     {
                //         loader: 'bemdecl-to-fs-loader',
                //         options: {
                //             // levels: ['desktop'],
                //             levels: ['src/blocks'],
                //             extensions: ['sass', 'js'],
                //         },
                //     },
                //     'html2bemdecl-loader'
                // ],
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            // hmr: isDev,
                            // reloadAll: isDev,
                            // publicPath: '../../', //------
                        },
                    },
                    'css-loader'
                ],
            },
            {
                test: /\.s[ac]ss/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            // publicPath: (resourcePath, context) => {
                            //     return path.relative(path.dirname(resourcePath), context + '/')
                            // },
                        }
                    },
                    'css-loader',
                    'sass-loader',
                ],
            },
            {
                test: /\.(?:|ico|gif|png|jpeg|jpg)$/,
                // test: /\.(?:|ico|gif|png|svg|jpeg|jpg)$/,
                type: 'asset/resource',
            },
            {
                test: /\.(ttf|otf|eot|woff|woff2|svg)$/,
                // use: ['url-loader?limit=10000'],
                use: [
                    {
                       loader: 'url-loader',
                       options: {
                           limit: 10000,
                        //    name: '[name].[ext]',
                           name: `fonts/[name].[ext]`,
                        //    publicPath: '../',
                        //    publicPath: 'http://localhost:4300/',
                        //    outputPath: 'fonts/',
                        },
                    },
                ]

                // use: ['url-loader?limit=10000&mimetype=application/font-woff']
            },
            // {
            //     test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
            //     use: ['url-loader?limit=10000&mimetype=application/font-woff']
            // }, 
            // {
            //     test: /\.[ot]tf$/,
            //     use: ['url-loader?limit=10000&mimetype=application/octet-stream']
            // }, 
            // {
            //     test: /\.(eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
            //     use: ['file-loader']
            // },

            // {
            //     // test: /\.(?:|ttf|woff(2)?|eot|otf|svg)(\?v=\d+\.\d+\.\d+)?$/,
            //     // test: /\.(?:|woff(2)?|eot|ttf|otf|svg)$/,
            //     // test: /\.(ttf?otf|eot|woff(2)|svg)$/,

            //     test: /\.(ttf|otf|eot|woff|woff2|svg)$/,
            //     type: 'asset/inline',
            //     use: [
            //         {
            //             loader: 'file-loader',
            //             options: {
            //                 // name: `./fonts/${filename('[ext]')}`,
            //                 name: `fonts/[name].[ext]`,
            //                 publicPath: '../',
            //                 // name: '[name].[ext]',
            //                 // outputPath: 'fonts/',
            //             },
            //         }
            //     ],
            // },
        ]
    }
}