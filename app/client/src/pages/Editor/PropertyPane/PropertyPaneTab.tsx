import React, { useMemo } from "react";
import styled from "styled-components";

import { Colors } from "constants/Colors";
import { TabComponent, TabProp, TabTitle } from "design-system";
import { Tab, TabList, Tabs } from "react-tabs";
import { useDispatch, useSelector } from "react-redux";
import { getSelectedPropertyTabIndex } from "selectors/editorContextSelectors";
import { setSelectedPropertyTabIndex } from "actions/editorContextActions";
import { AppState } from "@appsmith/reducers";

const StyledTabComponent = styled(TabComponent)`
  height: auto;

  .react-tabs__tab-list {
    display: none;
  }

  .react-tabs__tab-panel {
    overflow: initial;
    padding-bottom: 18px; // space for the BindingPrompt in case it shows at the last property
  }
`;

const StyledTabs = styled(Tabs)`
  position: sticky;
  top: 78px;
  z-index: 3;
  background: ${Colors.WHITE};
  padding: 0px 12px;
  border-bottom: 1px solid ${Colors.GREY_4};
  padding-bottom: 1px;

  .react-tabs__tab-list {
    border: 0;
    margin: 0;
  }

  .react-tabs__tab .tab-title {
    font-weight: 500;
    color: ${Colors.GRAY_700};
  }

  .react-tabs__tab {
    border: 2px solid transparent;
    bottom: -2px;
  }

  .react-tabs__tab--selected .tab-title {
    color: ${Colors.GREY_900};
  }

  .react-tabs__tab:focus {
    box-shadow: none;
    &:after {
      content: none;
    }
  }

  .react-tabs__tab--selected {
    border-width: 2px;
    border-radius: 0;
    border-color: transparent;
    border-bottom: 2px solid ${Colors.PRIMARY_ORANGE};
  }

  .tab-title {
    font-size: 12px;
  }
`;

type PropertyPaneTabProps = {
  styleComponent: JSX.Element | null;
  contentComponent: JSX.Element | null;
  isPanelProperty?: boolean;
  panelPropertyPath?: string;
};

export function PropertyPaneTab(props: PropertyPaneTabProps) {
  const dispatch = useDispatch();
  const selectedIndex = useSelector((state: AppState) =>
    getSelectedPropertyTabIndex(state, props.panelPropertyPath),
  );

  const setSelectedIndex = (index: number) => {
    dispatch(setSelectedPropertyTabIndex(index, props.panelPropertyPath));
  };

  const tabs = useMemo(() => {
    const arr: TabProp[] = [];
    if (props.contentComponent) {
      arr.push({
        key: "content",
        title: "CONTENT",
        panelComponent: props.contentComponent,
      });
    }
    if (props.styleComponent) {
      arr.push({
        key: "style",
        title: "STYLE",
        panelComponent: props.styleComponent,
      });
    }
    return arr;
  }, [props.styleComponent, props.contentComponent]);

  return (
    <>
      <StyledTabs onSelect={setSelectedIndex} selectedIndex={selectedIndex}>
        <TabList>
          {props.contentComponent && (
            <Tab>
              <TabTitle className="tab-title">CONTENT</TabTitle>
            </Tab>
          )}
          {props.styleComponent && (
            <Tab>
              <TabTitle className="tab-title">STYLE</TabTitle>
            </Tab>
          )}
        </TabList>
      </StyledTabs>
      <StyledTabComponent selectedIndex={selectedIndex} tabs={tabs} />
    </>
  );
}
