import React from "react";
import { Tab, Tabs, TabsList } from "design-system";

interface Props {
  activeTabKey: string;
  onSelect: (key: string) => void;
  options: Array<{ key: string; title: string }>;
}

export default function Menu(props: Props) {
  return (
    <Tabs onValueChange={props.onSelect} value={props.activeTabKey}>
      <TabsList>
        {props.options.map((tab) => (
          <Tab data-testid={"t--tab-" + tab.key} key={tab.key} value={tab.key}>
            {tab.title}
          </Tab>
        ))}
      </TabsList>
    </Tabs>
  );
}
