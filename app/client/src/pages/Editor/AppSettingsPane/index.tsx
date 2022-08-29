import { tailwindLayers } from "constants/Layers";
import React from "react";
import { useSelector } from "react-redux";
import { CSSTransition } from "react-transition-group";
import { getIsAppSettingsPaneOpen } from "selectors/appSettingsPaneSelectors";
import styled from "styled-components";
import PaneContent from "./PaneContent";

const CssTransitionWrapper = styled.div`
  width: 521px;
  height: 100%;
  box-shadow: 0 2px 4px -2px rgba(0, 0, 0, 0.06),
    0 4px 8px -2px rgba(0, 0, 0, 0.1);
  background: #fff;

  /* hidden by default */
  transform: translateX(100%);

  /* on enter flow */
  &.enter {
    /* hiding pane initially */
    transform: translateX(100%);
  }
  &.enter-active {
    /* show pane with animation */
    transform: translateX(0%);
    transition: transform 400ms;
  }
  &.enter-done {
    /* keep showing pane */
    transform: translateX(0%);
  }

  /* on exit flow */
  &.exit {
    /* showing pane intially */
    transform: translateX(0%);
  }
  &.exit-active {
    /* hide pane with animation */
    transition: transform 400ms;
    transform: translateX(100%);
  }
  &.exit-done {
    /* keep pane hidden */
    transform: translateX(100%);
  }
`;

function AppSettingsPane() {
  const isAppSettingsPaneOpen = useSelector(getIsAppSettingsPaneOpen);
  return (
    <CSSTransition
      in={isAppSettingsPaneOpen}
      mountOnEnter
      timeout={400}
      unmountOnExit
    >
      <CssTransitionWrapper
        className={`absolute ${tailwindLayers.appSettingsPane} right-0`}
      >
        <PaneContent />
      </CssTransitionWrapper>
    </CSSTransition>
  );
}

export default AppSettingsPane;
