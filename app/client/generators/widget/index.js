"use strict";

const widgetExists = require("../utils/widgetExists");

module.exports = {
  description: "Add a widget",
  prompts: [
    {
      type: "input",
      name: "name",
      message:
        "What should the widget be called? (Donot suffix `Widget` to the name)",
      default: "Button",
      validate: (inputValue) => {
        const value = `${inputValue}Widget`;
        if (/.+/.test(value)) {
          return widgetExists(value)
            ? "A widget with this name already exists"
            : true;
        }

        return "The widget name is required";
      },
    },
  ],
  actions: (data) => {
    // Generate index.ts and index.test.ts
    const actions = [
      {
        type: "add",
        path: "../src/widgets/{{suffixed name}}/index.ts",
        templateFile: "./widget/templates/index.js.hbs",
        abortOnFail: true,
      },
      {
        type: "add",
        path: "../src/widgets/{{suffixed name}}/widget/index.tsx",
        templateFile: "./widget/templates/widget/index.js.hbs",
        abortOnFail: true,
      },
      {
        type: "add",
        path: "../src/widgets/{{suffixed name}}/component/index.tsx",
        templateFile: "./widget/templates/component/index.js.hbs",
        abortOnFail: true,
      },
      {
        type: "add",
        path: "../src/widgets/{{suffixed name}}/constants.ts",
        templateFile: "./widget/templates/constants.js.hbs",
        abortOnFail: true,
      },
      {
        type: "add",
        path: "../src/widgets/{{suffixed name}}/icon.svg",
        templateFile: "./widget/templates/icon.svg.hbs",
        abortOnFail: true,
      },
    ];

    return actions;
  },
};
