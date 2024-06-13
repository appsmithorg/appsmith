import React from "react";
import { useDispatch, useSelector } from "react-redux";
import useIsInSideBySideEditor from "utils/hooks/useIsInSideBySideEditor";
import { LAYOUT_WRAPPER_ID } from "./constants";
import { sendAnalyticsForSideBySideHover } from "actions/analyticsActions";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";
import { LayoutSystemTypes } from "layoutSystems/types";

export const AnalyticsWrapper: React.FC = ({ children }) => {
  const dispatch = useDispatch();
  const isInSideBySideEditor = useIsInSideBySideEditor();
  const layoutSystemType = useSelector(getLayoutSystemType);

  const handleMouseLeave: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const wrapperElement = document.getElementById(LAYOUT_WRAPPER_ID);

    if (
      isInSideBySideEditor &&
      (layoutSystemType === LayoutSystemTypes.ANVIL ||
        (wrapperElement &&
          e.relatedTarget instanceof Element &&
          e.relatedTarget.contains(wrapperElement)))
    ) {
      dispatch(sendAnalyticsForSideBySideHover());
    }
  };
  return (
    <div
      className="contents"
      id={LAYOUT_WRAPPER_ID}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
};
