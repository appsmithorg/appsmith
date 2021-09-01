import React from "react";
import styled from "styled-components";
import Button from "components/ads/Button";
import { showDebugger } from "actions/debuggerActions";
import { useDispatch, useSelector } from "react-redux";
import { Classes, Variant } from "components/ads/common";
import { getAppMode } from "selectors/applicationSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getTypographyByKey } from "constants/DefaultTheme";

const StyledButton = styled(Button)`
 && {
  width: fit-content;
  margin-top: 4px;
  text-transform: none;
  ${(props) => getTypographyByKey(props, "p2")}
  .${Classes.ICON} {
    margin-right: 5px;
  }
  &:hover {
    .${Classes.ICON} {
      margin-right: 5px;
    }
  }
 }
`;

type DebugCTAProps = {
  className?: string;
  // For Analytics
  source?: string;
};

function DebugCTA(props: DebugCTAProps) {
  const dispatch = useDispatch();
  const appMode = useSelector(getAppMode);

  if (appMode === "PUBLISHED") return null;

  const onClick = () => {
    props.source &&
      AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
        source: props.source,
      });
    dispatch(showDebugger(true));
  };

  return <DebugButton className={props.className} onClick={onClick} />;
}

type DebugButtonProps = {
  className?: string;
  onClick: () => void;
};

export function DebugButton(props: DebugButtonProps) {
  return (
    <StyledButton
      className={props.className}
      icon="bug"
      onClick={props.onClick}
      tag="button"
      text="Debug"
      variant={Variant.danger}
    />
  );
}

export default DebugCTA;
