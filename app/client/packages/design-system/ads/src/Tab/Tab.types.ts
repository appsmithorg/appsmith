import type {
  TabsListProps as RadixTabsListProps,
  TabsProps as RadixTabsProps,
  TabsContentProps,
  TabsTriggerProps,
} from "@radix-ui/react-tabs";

export type TabsProps = RadixTabsProps;
export type TabsListProps = RadixTabsListProps;
export type TabProps = {
  /** the number of notifications the tab contains */
  notificationCount?: number;
} & TabsTriggerProps;
export type TabPanelProps = TabsContentProps;
