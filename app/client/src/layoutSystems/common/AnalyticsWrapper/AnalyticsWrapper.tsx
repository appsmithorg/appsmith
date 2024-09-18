import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { LAYOUT_WRAPPER_ID } from "./constants";
import { sendAnalyticsForSideBySideHover } from "actions/ideActions";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";
import { LayoutSystemTypes } from "layoutSystems/types";
import { useIsInSideBySideEditor } from "IDE/hooks";

export const AnalyticsWrapper: React.FC = ({ children }) => {
  const dispatch = useDispatch();
  const isInSideBySideEditor = useIsInSideBySideEditor();
  const layoutSystemType = useSelector(getLayoutSystemType);
  const isAnvil = layoutSystemType === LayoutSystemTypes.ANVIL;
  const className = isAnvil ? "contents" : "h-full";

  const handleMouseLeave: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const wrapperElement = document.getElementById(LAYOUT_WRAPPER_ID);

    if (
      isInSideBySideEditor &&
      (isAnvil || (wrapperElement && wrapperElement === e.target))
    ) {
      dispatch(sendAnalyticsForSideBySideHover());
    }
  };

  return (
    <div
      className={className}
      id={LAYOUT_WRAPPER_ID}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
};
