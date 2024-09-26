import React, { useCallback } from "react";
import styled from "styled-components";

import { useDispatch, useSelector } from "react-redux";
import { Tabs, TabsList, Tab, TabPanel } from "@appsmith/ads";
import { getSelectedPropertyTabIndex } from "selectors/editorContextSelectors";
import { setSelectedPropertyTabIndex } from "actions/editorContextActions";
import type { AppState } from "ee/reducers";

interface PropertyPaneTabProps {
  styleComponent: JSX.Element | null;
  contentComponent: JSX.Element | null;
  isPanelProperty?: boolean;
  panelPropertyPath?: string;
}

const tabs = ["content", "style"];

const StyledTabs = styled(Tabs)`
  > [role="tabpanel"] {
    margin-top: 0;
  }

  > [role="tablist"] {
    position: sticky;
    top: 74px;
    z-index: 3;
    background: var(--ads-v2-color-white);
    overflow: hidden;
    padding: var(--ads-v2-spaces-1) var(--ads-v2-spaces-4);
  }
`;

export function PropertyPaneTab(props: PropertyPaneTabProps) {
  const dispatch = useDispatch();
  const selectedIndex = useSelector((state: AppState) =>
    getSelectedPropertyTabIndex(state, props.panelPropertyPath),
  );

  const setSelectedIndex = useCallback(
    (index: number) => {
      dispatch(setSelectedPropertyTabIndex(index, props.panelPropertyPath));
    },
    [dispatch, props.panelPropertyPath],
  );
  const onValueChange = useCallback(
    (value) => {
      setSelectedIndex(tabs.indexOf(value) || 0);
    },
    [setSelectedIndex],
  );

  return (
    <StyledTabs onValueChange={onValueChange} value={tabs[selectedIndex]}>
      <TabsList>
        {props.contentComponent && <Tab value={tabs[0]}>Content</Tab>}
        {props.styleComponent && <Tab value={tabs[1]}>Style</Tab>}
      </TabsList>
      {props.contentComponent && (
        <TabPanel value={tabs[0]}>{props.contentComponent}</TabPanel>
      )}
      {props.styleComponent && (
        <TabPanel value={tabs[1]}>{props.styleComponent}</TabPanel>
      )}
    </StyledTabs>
  );
}
