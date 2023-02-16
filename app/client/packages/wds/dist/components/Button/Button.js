import { __rest } from "tslib";
import React, { useMemo, forwardRef } from "react";
import { Spinner } from "../Spinner";
import { StyledButton } from "./index.styled";
// types
export const BUTTON_VARIANTS = [
    "filled",
    "outline",
    "light",
    "subtle",
    "input",
];
// component
const Button = forwardRef((props, ref) => {
    const { children, isDisabled, isLoading, leadingIcon, trailingIcon, variant = "filled" } = props, rest = __rest(props, ["children", "isDisabled", "isLoading", "leadingIcon", "trailingIcon", "variant"]);
    const content = useMemo(() => {
        if (isLoading)
            return React.createElement(Spinner, null);
        return (React.createElement(React.Fragment, null,
            leadingIcon && React.createElement("span", { "data-component": "leadingIcon" }, leadingIcon),
            children && React.createElement("span", { "data-component": "text" }, children),
            trailingIcon && (React.createElement("span", { "data-component": "trailingIcon" }, trailingIcon))));
    }, [isLoading, children, trailingIcon, leadingIcon]);
    return (React.createElement(StyledButton, Object.assign({}, rest, { "data-button": true, "data-disabled": isDisabled || undefined, "data-loading": isLoading || undefined, "data-variant": variant, disabled: isDisabled || undefined, ref: ref, variant: variant }), content));
});
Button.displayName = "Button";
export { Button };
//# sourceMappingURL=Button.js.map