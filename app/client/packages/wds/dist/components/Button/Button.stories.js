import React from "react";
import { Button } from "./index";
const HIDDEN_ARGS = [
    "theme",
    "forwardedAs",
    "as",
    "boxShadow",
    "borderRadius",
    "ref",
    "tooltip",
];
export default {
    title: "Design System/Button",
    component: Button,
    argTypes: Object.assign({ variant: {
            defaultValue: "filled",
            options: ["filled", "outline", "subtle", "light"],
            control: { type: "radio" },
            table: { defaultValue: { summary: "filled" } },
        } }, HIDDEN_ARGS.reduce((acc, arg) => {
        acc[arg] = { table: { disable: true } };
        return acc;
    }, {})),
    args: {
        children: "Button",
        isLoading: false,
        isDisabled: false,
    },
    parameters: {
        height: "32px",
        width: "180px",
    },
};
// eslint-disable-next-line react/function-component-definition
const Template = (args) => {
    return React.createElement(Button, Object.assign({}, args));
};
export const TextStory = Template.bind({});
TextStory.storyName = "Button";
//# sourceMappingURL=Button.stories.js.map