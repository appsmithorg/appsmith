import React from "react";
import styled from "styled-components";
import Button from "components/ads/Button";
import { showDebugger } from "actions/debuggerActions";
import { useDispatch, useSelector } from "react-redux";
import { Variant } from "components/ads/common";
import { getAppMode } from "selectors/applicationSelectors";

const StyledButton = styled(Button)`
  width: fit-content;
  margin-top: 4px;
  text-transform: none;
  font-size: 13px;
  height: 22px;
  font-weight: normal;
`;

type DebugCTAProps = {
  className?: string;
};

const DebugCTA = (props: DebugCTAProps) => {
  const dispatch = useDispatch();
  const appMode = useSelector(getAppMode);

  if (appMode === "PUBLISHED") return null;

  return (
    <DebugButton
      className={props.className}
      onClick={() => dispatch(showDebugger(true))}
    />
  );
};

export const DebugButton = (props: any) => {
  return (
    <StyledButton
      className={props.className}
      onClick={props.onClick}
      icon="bug"
      text="Debug"
      variant={Variant.danger}
    />
  );
};

export default DebugCTA;
