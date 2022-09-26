import { WidgetProps } from "widgets/BaseWidget";

export interface TabContainerWidgetProps extends WidgetProps {
  tabId: string;
}

export interface TabsWidgetProps<T extends TabContainerWidgetProps>
  extends WidgetProps {
  isVisible?: boolean;
  shouldScrollContents: boolean;
  tabs: Array<{
    id: string;
    label: string;
    widgetId: string;
    isVisible?: boolean;
  }>;
  tabsObj: Record<
    string,
    {
      id: string;
      label: string;
      widgetId: string;
      isVisible?: boolean;
      index: number;
    }
  >;
  shouldShowTabs: boolean;
  children: T[];
  snapColumns?: number;
  onTabSelected?: string;
  snapRows?: number;
  defaultTab: string;
  selectedTabWidgetId: string;
  borderRadius: string;
  boxShadow?: string;
  primaryColor: string;
}

export const SCROLL_NAV_CONTROL_CONTAINER_WIDTH = 30;
