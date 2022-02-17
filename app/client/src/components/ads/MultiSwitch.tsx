import React from "react";
import styled from "styled-components";
import { CommonComponentProps } from "./common";
import Text, { Case, TextType } from "./Text";

export type TabProp<T> = {
  key: string;
  title: T;
  panelComponent: JSX.Element;
};

const TabList = styled.div`
  margin-left: 30px;
  display: flex;
  align-items: center;
  height: 24px;
  background-color: ${(props) => props.theme.colors.multiSwitch.bg};
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
		background-color: ${props.theme.colors.multiSwitch.selectedBg};
		`
      : null};
  border-right: 1px solid ${(props) => props.theme.colors.multiSwitch.border};
`;

type MultiSwitchProps<T> = CommonComponentProps & {
  tabs: Array<TabProp<T>>;
  selected: { title: T; value: string };
  onSelect: (title: string) => void;
};

export default function MultiSwitch<T>(props: MultiSwitchProps<T>) {
  const selectedTab = props.tabs.find(
    (tab) => tab.key === props.selected.value,
  );
  return (
    <div data-cy={props.cypressSelector}>
      <TabList>
        {props.tabs.map((tab) => (
          <Tab
            data-cy={`tab--${tab.title}`}
            key={tab.key}
            onClick={() => props.onSelect(tab.key)}
            selected={props.selected.value === tab.key}
          >
            <Text case={Case.UPPERCASE} type={TextType.P3}>
              {tab.title}
            </Text>
          </Tab>
        ))}
      </TabList>
      {selectedTab && <TabContent>{selectedTab.panelComponent}</TabContent>}
    </div>
  );
}
