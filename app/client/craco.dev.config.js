const merge = require("webpack-merge");
const common = require("./craco.common.config.js");

module.exports = merge(common, {
    babel: {
        plugins: ["babel-plugin-styled-components"]
    },
    devServer:{
        https: true,
        proxy: [{
            context: ["/api", "/login", "/oauth2"],
            target: process.env.REACT_APP_APPSMITH_BACKEND_PROXY || "http://localhost:8080",
            changeOrigin: true,
            secure: false,
        },
        {
            context: ["/f"],
            target: "https://cdn.optimizely.com",
            secure: false,
        }]
    }
});
