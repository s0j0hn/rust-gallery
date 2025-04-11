const path = require('path')
const CompressionPlugin = require('compression-webpack-plugin')
const BundleAnalyzerPlugin =
    require('webpack-bundle-analyzer').BundleAnalyzerPlugin
/**
 * @type {import('@craco/types').CracoConfig}
 */
module.exports = {
    eslint: {
        enable: false,
    },
    webpack: {
        configure: (webpackConfig, { env, paths }) => {
            // Split chunks optimization - simplified approach to avoid errors
            webpackConfig.optimization.splitChunks = {
                chunks: 'all',
                maxInitialRequests: 5,
                maxAsyncRequests: 5,
                minSize: 20000,
                cacheGroups: {
                    // React and related packages
                    react: {
                        test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
                        name: 'vendor-react',
                        chunks: 'all',
                        priority: 40,
                    },
                    // UI and styling libraries
                    ui: {
                        test: /[\\/]node_modules[\\/](tailwindcss|@headlessui|@heroicons|lucide-react|react-photoswipe-gallery)[\\/]/,
                        name: 'vendor-ui',
                        chunks: 'all',
                        priority: 30,
                    },
                    // Utilities
                    utils: {
                        test: /[\\/]node_modules[\\/](axios|dompurify|web-vitals|swagger-ui-react)[\\/]/,
                        name: 'vendor-utils',
                        chunks: 'all',
                        priority: 20,
                    },
                    // All other vendor modules
                    vendors: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all',
                        priority: 10,
                    },
                    // Common code used across multiple chunks
                    common: {
                        name: 'common',
                        minChunks: 2,
                        chunks: 'all',
                        priority: 5,
                        reuseExistingChunk: true,
                    },
                },
            }

            // Enable performance hints
            webpackConfig.performance = {
                maxEntrypointSize: 512000,
                maxAssetSize: 512000,
                hints: 'warning',
            }

            // Add compression plugin to generate .gz files
            webpackConfig.plugins.push(
                new CompressionPlugin({
                    algorithm: 'gzip',
                    test: /\.(js|css|html|svg)$/,
                    threshold: 10240, // Only compress assets bigger than 10KB
                    minRatio: 0.8,
                })
            )

            // Add bundle analyzer in production when ANALYZE=true is set
            if (process.env.ANALYZE === 'true') {
                webpackConfig.plugins.push(
                    new BundleAnalyzerPlugin({
                        analyzerMode: 'static',
                        reportFilename: 'bundle-report.html',
                        openAnalyzer: false, // Set to true to automatically open the report
                    })
                )
            }

            // Reduce the size of sourcemaps in production
            if (env === 'production' && webpackConfig.devtool) {
                webpackConfig.devtool = 'source-map'
            }

            // Minimize CSS in production
            if (env === 'production') {
                const miniCssExtractPlugin = webpackConfig.plugins.find(
                    (plugin) =>
                        plugin.constructor.name === 'MiniCssExtractPlugin'
                )

                if (miniCssExtractPlugin) {
                    miniCssExtractPlugin.options.ignoreOrder = true // Ignore order warnings
                }
            }

            return webpackConfig
        },
    },
}
