import WidgetStyleContainer, {
  WidgetStyleContainerProps,
} from "components/designSystems/appsmith/WidgetStyleContainer";
import React, { ReactNode } from "react";
import { pick } from "lodash";

function VerticalLayoutComponent(props: VerticalLayoutComponentProps) {
  return (
    <WidgetStyleContainer
      {...pick(props, [
        "widgetId",
        "containerStyle",
        "backgroundColor",
        "borderColor",
        "borderWidth",
        "borderRadius",
        "boxShadow",
      ])}
    >
      {props.children}
    </WidgetStyleContainer>
  );
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface VerticalLayoutComponentProps
  extends WidgetStyleContainerProps {
  children?: ReactNode;
}

export default VerticalLayoutComponent;
