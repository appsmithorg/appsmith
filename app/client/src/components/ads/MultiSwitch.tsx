import React, { useState } from "react";
import styled from "styled-components";
import { CommonComponentProps } from "./common";
import Text, { Case, TextType } from "./Text";

export type TabProp = {
  key: string;
  title: string;
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

const TabContent = styled.div<{ selected: boolean }>`
  height: calc(100% - 24px);
  ${(props) =>
    !props.selected
      ? `
		display: none
		`
      : null};
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

type MultiSwitchProps = CommonComponentProps & {
  tabs: Array<TabProp>;
  selected?: { title: string };
  onSelect?: (title?: string) => void;
};

export default function MultiSwitch(props: MultiSwitchProps) {
  const [selected, setSelected] = useState<string>(
    (props.selected && props.selected.title) || props.tabs[0].title,
  );

  const tabClickHandler = (title: string) => {
    props.onSelect && props.onSelect(title);
    setSelected(title);
  };

  return (
    <div data-cy={props.cypressSelector}>
      <TabList>
        {props.tabs.map((tab) => (
          <Tab
            key={tab.key}
            selected={selected === tab.title}
            onClick={() => tabClickHandler(tab.title)}
          >
            <Text type={TextType.P3} case={Case.UPPERCASE}>
              {tab.title}
            </Text>
          </Tab>
        ))}
      </TabList>
      {props.tabs.map((tab) => (
        <TabContent key={tab.key} selected={selected === tab.title}>
          {tab.panelComponent}
        </TabContent>
      ))}
    </div>
  );
}
