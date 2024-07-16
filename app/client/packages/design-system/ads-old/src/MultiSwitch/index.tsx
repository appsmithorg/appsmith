import React, { useEffect } from "react";
import styled from "styled-components";
import Text, { Case, TextType } from "../Text";
import type { CommonComponentProps } from "../types/common";

interface TabProp<T> {
  key: string;
  title: T;
  panelComponent: JSX.Element;
}

const TabList = styled.div`
  margin-left: 30px;
  display: flex;
  align-items: center;
  height: 24px;
  background-color: var(--ads-multiswitch-tab-list-background-color);
  width: fit-content;
  margin-bottom: 12px;
  padding-left: 1px;
`;

const TabContent = styled.div`
  height: calc(100% - 24px);
`;

const Tab = styled.div<{ selected: boolean }>`
  display: flex;
  align-items: center;
  cursor: pointer;
  height: 22px;
  padding: 0 12px;
  ${(props) =>
    props.selected
      ? `
		background-color: var(--ads-multiswitch-selected-background-color);
		`
      : null};
  border-right: 1px solid var(--ads-multiswitch-border-color);
`;

const TabHeader = styled.div<{ stickyTabHeader?: boolean }>`
  ${({ stickyTabHeader }) =>
    stickyTabHeader &&
    `
      background-color: var(--ads-multiswitch-tab-header-background-color);
      position: sticky;
      top: -10px;
      z-index: 10;
      padding-top: 10px;
      padding-bottom: 5px;
      overflow: hidden;
    `}
`;

type MultiSwitchProps<T> = CommonComponentProps & {
  tabs: Array<TabProp<T>>;
  selected: { title: T; value: string };
  stickyTabHeader?: boolean;
  customStyle?: Record<string, string>;
  onSelect: (title: string) => void;
};

export default function MultiSwitch<T>(props: MultiSwitchProps<T>) {
  const { onSelect } = props;
  const selectedTab = props.tabs.find(
    (tab) => tab.key === props.selected.value,
  );

  useEffect(() => {
    onSelect(props.selected.value);
  }, []);

  // eslint-disable-next-line no-console
  console.log(props);

  return (
    <div data-cy={props.cypressSelector}>
      <TabHeader
        stickyTabHeader={props.stickyTabHeader}
        style={props.customStyle}
      >
        <TabList>
          {props.tabs.map((tab) => (
            <Tab
              className={`${
                props.selected.value === tab.key ? "t--tab-selected" : ""
              }`}
              data-cy={`tab--${tab.title}`}
              key={tab.key}
              onClick={() => onSelect(tab.key)}
              selected={props.selected.value === tab.key}
            >
              <Text case={Case.UPPERCASE} type={TextType.P3}>
                {tab.title}
              </Text>
            </Tab>
          ))}
        </TabList>
      </TabHeader>
      {selectedTab && <TabContent>{selectedTab.panelComponent}</TabContent>}
    </div>
  );
}
