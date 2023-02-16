import { __rest } from "tslib";
import React from "react";
import { ButtonGroup } from "./index";
import { Button } from "../Button";
export default {
    title: "Design System/Button Group",
    component: ButtonGroup,
    argTypes: {
        variant: {
            defaultValue: "filled",
            options: ["filled", "outline", "subtle", "light"],
            control: { type: "radio" },
        },
    },
};
// eslint-disable-next-line react/function-component-definition
const Template = (_a) => {
    var { orientation } = _a, args = __rest(_a, ["orientation"]);
    return (React.createElement(ButtonGroup, { orientation: orientation },
        React.createElement(Button, Object.assign({}, args), "Option 1"),
        React.createElement(Button, Object.assign({}, args), "Option 2"),
        React.createElement(Button, Object.assign({}, args), "Option 3")));
};
export const TextStory = Template.bind({});
TextStory.storyName = "Button Group";
TextStory.args = {
    isLoading: false,
    isDisabled: false,
};
TextStory.parameters = {
    height: "32px",
    width: "300px",
};
//# sourceMappingURL=ButtonGroup.stories.js.map