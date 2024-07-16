import React, { useState } from "react";
import type { ComponentMeta } from "@storybook/react";

import MultiSwitchComponent from "./index";

export default {
  title: "Design System/MultiSwitch",
  component: MultiSwitchComponent,
} as ComponentMeta<typeof MultiSwitchComponent>;

export function MultiSwitch() {
  const tabs = [
    {
      key: "tab-1",
      title: "Tab 1",
      panelComponent: <div>Panel 1</div>,
    },
    {
      key: "tab-2",
      title: "Tab 2",
      panelComponent: <div>Panel 2</div>,
    },
    {
      key: "tab-3",
      title: "Tab 3",
      panelComponent: <div>Panel 3</div>,
    },
  ];
  const [selected, setSelected] = useState({
    title: tabs[0].title,
    value: tabs[0].key,
  });

  const handleSelect = (key: string) => {
    setSelected({
      value: key,
      title: tabs.find((tab) => tab.key === key)?.title || "",
    });
  };

  return (
    <MultiSwitchComponent
      // eslint-disable-next-line no-console
      onSelect={handleSelect}
      selected={selected}
      tabs={tabs}
    />
  );
}
