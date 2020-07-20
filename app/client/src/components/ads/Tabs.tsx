import { CommonComponentProps } from "./common";

type TabsProps = CommonComponentProps & {
  tabs: Array<{
    key: string;
    title: string;
    panelComponent: JSX.Element;
  }>;
  selectedIndex?: number;
  setSelectedIndex?: Function;
  overflow?: boolean;
};

// Create a wrapper around react-tabs
// Migrate TabbedViewx
export default function Tabs(props: TabsProps) {
  return "";
}
