const merge = require("webpack-merge");
const common = require("./craco.common.config.js");
const { DefinePlugin } = require('webpack');
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Override from .env file
let parsedEnv = Object.assign(dotenv.parse(
    fs.readFileSync(path.join(__dirname, "../../.env.example"), {
      encoding: "utf-8",
    })), dotenv.parse(
    fs.readFileSync(path.join(__dirname, "../../.env"), {
      encoding: "utf-8",
    }),
));

// Override from APPSMITH_ process.env keys
Object.keys(process.env).forEach(key => {
    if (key.startsWith("APPSMITH_")) {
        parsedEnv[key] = process.env[key];
    }
});

// set default for nginx sub_filter and JSON stringify everything
Object.keys(parsedEnv).forEach(key => {
    if (!parsedEnv[key]) {
        parsedEnv[key] = `__${key}__`;
    }
    parsedEnv[key] = JSON.stringify(parsedEnv[key]);
});


module.exports = merge(common, {
    babel: {
        plugins: ["babel-plugin-styled-components"]
    },
    webpack:{
        plugins:[new DefinePlugin({"appsmith.env": parsedEnv})]
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
