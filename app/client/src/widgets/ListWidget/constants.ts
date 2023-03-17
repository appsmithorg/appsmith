import { WidgetProps } from "widgets/BaseWidget";
import { ContainerStyle } from "widgets/ContainerWidget/component";

export interface ListWidgetProps<T extends WidgetProps> extends WidgetProps {
  children?: T[];
  containerStyle?: ContainerStyle;
  shouldScrollContents?: boolean;
  onListItemClick?: string;
  listData: Array<Record<string, unknown>>;
  currentItemStructure?: Record<string, string>;
}
