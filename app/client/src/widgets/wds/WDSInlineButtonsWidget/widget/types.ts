import type {
  InlineButtonsProps,
  InlineButtonsItem,
} from "@design-system/widgets";
import type { WidgetProps } from "widgets/BaseWidget";
import type { InlineButtonsItemComponentProps } from "../component/types";

export type ButtonsList = Record<string, InlineButtonsItemComponentProps>;

export interface InlineButtonsWidgetProps
  extends WidgetProps,
    InlineButtonsProps<InlineButtonsItem> {
  isVisible: boolean;
  buttonsList: ButtonsList;
}
