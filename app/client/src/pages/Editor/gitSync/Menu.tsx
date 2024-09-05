import React from "react";
import { Tab, Tabs, TabsList } from "@appsmith/ads";
import styled from "styled-components";

interface Props {
  activeTabKey: string;
  onSelect: (key: string) => void;
  options: Array<{ key: string; title: string; disabled?: boolean }>;
}

const StyledTab = styled(Tab)`
  &:disabled,
  [disabled] {
    cursor: not-allowed;
  }
`;

export default function Menu(props: Props) {
  return (
    <Tabs onValueChange={props.onSelect} value={props.activeTabKey}>
      <TabsList>
        {props.options.map((tab) => (
          <StyledTab
            data-testid={"t--tab-" + tab.key}
            disabled={tab.disabled ?? false}
            key={tab.key}
            value={tab.key}
          >
            {tab.title}
          </StyledTab>
        ))}
      </TabsList>
    </Tabs>
  );
}
