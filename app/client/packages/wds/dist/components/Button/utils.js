import { __rest } from "tslib";
export const transformV1ButtonProps = (v1Props) => {
    const { buttonColor, buttonVariant, text, widgetName } = v1Props, rest = __rest(v1Props, ["buttonColor", "buttonVariant", "text", "widgetName"]);
    const transformedProps = Object.assign({}, rest);
    switch (buttonVariant) {
        case "PRIMARY":
            transformedProps.variant = "filled";
            break;
        case "SECONDARY":
            transformedProps.variant = "outline";
            break;
        case "TERTIARY":
            transformedProps.variant = "subtle";
            break;
    }
    transformedProps.children = text;
    transformedProps.accentColor = buttonColor;
    return Object.assign(Object.assign({}, transformedProps), { widgetName: widgetName || "Button" });
};
//# sourceMappingURL=utils.js.map