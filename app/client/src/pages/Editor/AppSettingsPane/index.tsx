import classNames from "classnames";
import { tailwindLayers } from "constants/Layers";
import React from "react";
import styled from "styled-components";
import AppSettings from "./AppSettings";
import PaneHeader from "./AppSettings/PaneHeader";

const Wrapper = styled.div`
  width: 521px;
  height: 100%;
  box-shadow: 0 2px 4px -2px rgba(0, 0, 0, 0.06),
    0 4px 8px -2px rgba(0, 0, 0, 0.1);
  background: #fff;
`;

interface AppSettingsPaneProps {
  isOpen: boolean;
}

function AppSettingsPane(props: AppSettingsPaneProps) {
  return (
    <Wrapper
      className={classNames({
        [`absolute ${tailwindLayers.appSettingsPane} right-0`]: true,
        "translate-x-full": !props.isOpen,
        "transition-all duration-400": true,
      })}
    >
      <PaneHeader />
      <AppSettings />
    </Wrapper>
  );
}

export default AppSettingsPane;
