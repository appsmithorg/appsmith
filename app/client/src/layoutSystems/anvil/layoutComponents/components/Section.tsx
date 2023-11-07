import type { LayoutProps } from "layoutSystems/anvil/utils/anvilTypes";
import {
  type LayoutComponentProps,
  LayoutComponentTypes,
} from "layoutSystems/anvil/utils/anvilTypes";
import WidgetRow from "./WidgetRow";

class Section extends WidgetRow {
  constructor(props: LayoutComponentProps) {
    super(props);
  }

  static type: LayoutComponentTypes = LayoutComponentTypes.SECTION;

  static getChildTemplate(props: LayoutProps): LayoutProps | null {
    return null && props;
  }
}

export default Section;
