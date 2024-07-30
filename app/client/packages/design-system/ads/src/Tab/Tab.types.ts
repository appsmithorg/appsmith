import type {
  TabsContentProps,
  TabsListProps as RadixTabsListProps,
  TabsProps as RadixTabsProps,
  TabsTriggerProps,
} from "@radix-ui/react-tabs";

export type TabsProps = RadixTabsProps;
export type TabsListProps = RadixTabsListProps;
export type TabProps = {
  /** the number of notifications the tab contains */
  notificationCount?: number;
} & TabsTriggerProps;
export type TabPanelProps = TabsContentProps;
