const path = require("path");
module.exports = [
    {
        name: "@storybook/preset-create-react-app",
        options: {
            tsDocgenLoaderOptions: {
                tsconfigPath: path.resolve(__dirname, "../tsconfig.json")
            }
        }
    },
    {
        name: "@storybook/addon-docs/preset",
        options: {
            configureJSX: true,
            sourceLoaderOptions: null
        }
    }
];
