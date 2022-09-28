import React, { ReactNode } from "react";
import WidgetStyleContainer, {
  WidgetStyleContainerProps,
} from "components/designSystems/appsmith/WidgetStyleContainer";
import { pick } from "lodash";

function HorizontalLayoutComponent(props: HorizontalLayoutComponentProps) {
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

export interface HorizontalLayoutComponentProps
  extends WidgetStyleContainerProps {
  children?: ReactNode;
}

export default HorizontalLayoutComponent;
