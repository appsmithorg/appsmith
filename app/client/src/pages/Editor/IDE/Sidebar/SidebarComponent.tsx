import React , { useState } from "react";
import styled from "styled-components";
import SidebarButton from "./SidebarButton";
import type { SidebarButton as SidebarButtonType } from "@appsmith/entities/IDE/constants";
import { SideButtonType } from "@appsmith/entities/IDE/constants";
import { useSelector } from "react-redux";
import { getDatasources } from "@appsmith/selectors/entitiesSelector";

const Container = styled.div`
  width: 50px;
  border-right: 1px solid var(--ads-v2-color-border);
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-color: var(--ads-v2-color-bg);
  position: relative;
`;

interface SidebarComponentProps {
  topButtons: SidebarButtonType[];
  bottomButtons: SidebarButtonType[];
  appState: string;
  onClick: (suffix: string) => void;
}

function SidebarComponent({ topButtons, bottomButtons, appState, onClick }: SidebarComponentProps) {
  const [selectedState, setSelectedState] = useState<string | null>(appState);
  const datasources = useSelector(getDatasources);
  const getConditionalIconAndTooltip = (
    type?: SideButtonType,
    conditionTooltip?: string,
  ) => {
    switch (type) {
      case SideButtonType.DATSOURCE:
        if (datasources.length === 0)
          return {
            conditionIcon: "warning",
            tooltip: conditionTooltip,
          };
        return {};
      default:
        return {};
    }
  };
  
  const handleButtonClick = (state: string, urlSuffix: string) => {
    const newState = selectedState === state ? null : state;
    setSelectedState(newState);
    onClick(newState ? urlSuffix : "");
  };

  return (
    <Container className="t--sidebar" id="t--app-sidebar">
    <div>
      {topButtons.map(({ state, icon, urlSuffix, title, conditionType, conditionTooltip }) => (
        <SidebarButton
          key={state}
          icon={icon}
          onClick={() => handleButtonClick(state, urlSuffix)}
          selected={selectedState === state}
          title={title}
          {...getConditionalIconAndTooltip(conditionType, conditionTooltip)}
        />
      ))}
    </div>
    <div>
      {bottomButtons.map(({ state, icon, urlSuffix, title }) => (
        <SidebarButton
          key={state}
          icon={icon}
          onClick={() => handleButtonClick(state, urlSuffix)}
          selected={selectedState === state}
          tooltip={title}
        />
      ))}
    </div>
  </Container>
  );
}

export default SidebarComponent;