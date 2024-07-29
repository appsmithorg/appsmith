import React from "react";
import clsx from "classnames";

import {
  StyledTabs,
  StyledTab,
  StyledTabPanel,
  StyledTabsList,
} from "./Tab.styles";

import { Text } from "../Text";
import type {
  TabPanelProps,
  TabProps,
  TabsListProps,
  TabsProps,
} from "./Tab.types";
import { Tag } from "../Tag";
import {
  TabsClassName,
  TabsListClassName,
  TabsListTabClassName,
  TabsListTabCountClassName,
  TabsPanelClassName,
} from "./Tab.constants";

/* TODO
- border styles using ::before
- vertical tabs
- focus styles
 */

function Tabs(props: TabsProps) {
  const { className, defaultValue, ...rest } = props;
  return (
    <StyledTabs
      className={clsx(TabsClassName, className)}
      defaultValue={defaultValue}
      {...rest}
    >
      {props.children}
    </StyledTabs>
  );
}

function TabsList(props: TabsListProps) {
  const { children, className, ...rest } = props;
  return (
    <StyledTabsList
      className={clsx(TabsListClassName, className)}
      {...rest}
      loop
    >
      {children}
    </StyledTabsList>
  );
}

function Tab(props: TabProps) {
  const { children, className, notificationCount, value, ...rest } = props;
  return (
    <StyledTab
      className={clsx(TabsListTabClassName, className)}
      value={value}
      {...rest}
    >
      <Text color="inherit" kind="action-m">
        {children}
      </Text>
      {!!notificationCount && notificationCount > 0 && (
        <Tag className={TabsListTabCountClassName} isClosable={false}>
          {notificationCount > 9 ? "9+" : notificationCount}
        </Tag>
      )}
    </StyledTab>
  );
}

function TabPanel(props: TabPanelProps) {
  const { className, ...rest } = props;
  return (
    <StyledTabPanel
      className={clsx(TabsPanelClassName, className)}
      {...rest}
      tabIndex={-1}
    />
  );
}
export { Tabs, TabsList, Tab, TabPanel };
