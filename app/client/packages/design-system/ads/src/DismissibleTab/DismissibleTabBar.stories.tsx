/* eslint-disable no-console */
import React, { useEffect, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import {
  DismissibleTab,
  DismissibleTabBar,
  type DismissibleTabBarProps,
} from ".";

const meta: Meta<typeof DismissibleTabBar> = {
  title: "ADS/Components/Dismissible Tab Bar",
  component: DismissibleTabBar,
};

export default meta;

const createTabs = (count: number) => {
  const tabs = [];

  for (let i = 1; i <= count; i++) {
    tabs.push({ id: `tab${i}`, label: `Tab ${i}` });
  }

  return tabs;
};

const INITIAL_TAB_COUNT = 5;
const initialTabs = createTabs(INITIAL_TAB_COUNT);

interface StoryProps extends DismissibleTabBarProps {
  containerWidth: number;
}

const Template = (props: StoryProps) => {
  const { containerWidth, disableAdd } = props;

  const tabCountRef = useRef<number>(INITIAL_TAB_COUNT);
  const [tabs, setTabs] = useState(initialTabs);
  const [activeTabId, setActiveTabId] = useState(initialTabs[0].id);

  const handleClose = (tabId: string) => () => {
    const closedTabIndex = tabs.findIndex((tab) => tab.id === tabId);
    const filteredTabs = tabs.filter((tab) => tab.id !== tabId);

    setTabs(filteredTabs);

    if (activeTabId === tabId && filteredTabs.length) {
      if (closedTabIndex >= filteredTabs.length) {
        const nextIndex = Math.max(0, closedTabIndex - 1);
        const nextTab = filteredTabs[nextIndex];

        setActiveTabId(nextTab.id);
      } else {
        const nextTab = filteredTabs[closedTabIndex];

        setActiveTabId(nextTab.id);
      }
    }
  };

  const handleClick = (tabId: string) => () => {
    setActiveTabId(tabId);
  };

  const handleTabAdd = () => {
    const tabNumber = ++tabCountRef.current;
    const tabId = `tab${tabNumber}`;
    const nextTabs = [...tabs, { id: tabId, label: `Tab ${tabNumber}` }];

    setTabs(nextTabs);
    setActiveTabId(tabId);
  };

  useEffect(
    function scrollAddedTabIntoView() {
      const activeTabElement = document.querySelector(".editor-tab.active");

      if (activeTabElement) {
        activeTabElement.scrollIntoView({
          inline: "nearest",
          behavior: "smooth",
        });
      }
    },
    [activeTabId],
  );

  return (
    <div style={{ width: containerWidth }}>
      <DismissibleTabBar disableAdd={disableAdd} onTabAdd={handleTabAdd}>
        {tabs.map((tab) => (
          <DismissibleTab
            isActive={tab.id === activeTabId}
            key={tab.id}
            onClick={handleClick(tab.id)}
            onClose={handleClose(tab.id)}
          >
            {tab.label}
          </DismissibleTab>
        ))}
      </DismissibleTabBar>
    </div>
  );
};

export const Basic = Template.bind({}) as StoryObj;

Basic.argTypes = {
  containerWidth: {
    control: { type: "range", min: 200, max: 600, step: 10 },
  },
};

Basic.args = {
  disableAdd: false,
  containerWidth: 450,
};
