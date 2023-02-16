import { __rest } from "tslib";
/* eslint-disable react/no-unused-prop-types */
import React, { forwardRef } from "react";
import { StyledContainer } from "./index.styled";
// component
export const ButtonGroup = forwardRef((props, ref) => {
    const { orientation = "horizontal" } = props, others = __rest(props, ["orientation"]);
    return React.createElement(StyledContainer, Object.assign({ orientation: orientation, ref: ref }, others));
});
ButtonGroup.displayName = "ButtonGroup";
//# sourceMappingURL=ButtonGroup.js.map