import React from "react";
import _ from "lodash";
import { WidgetProps } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import ContainerWidget from "widgets/ContainerWidget";
import { ContainerComponentProps } from "components/designSystems/appsmith/ContainerComponent";

class FormWidget extends ContainerWidget {
  checkInvalidChildren = (children: WidgetProps[]): boolean => {
    return _.some(children, child => {
      if ("children" in child) return this.checkInvalidChildren(child.children);
      if ("isValid" in child) return !child.isValid;
      return false;
    });
  };

  handleResetInputs = () => {
    super.resetChildrenMetaProperty(this.props.widgetId);
  };

  renderChildWidget(childWidgetData: WidgetProps): React.ReactNode {
    if (childWidgetData.type === "FORM_BUTTON_WIDGET" && this.props.children) {
      const isInvalid = this.checkInvalidChildren(this.props.children);
      if (isInvalid) childWidgetData.isFormValid = false;
      // Add submit and reset handlers
      childWidgetData.onReset = this.handleResetInputs;
    }
    return super.renderChildWidget(childWidgetData);
  }

  getWidgetType(): WidgetType {
    return "FORM_WIDGET";
  }
}

export interface FormWidgetProps extends ContainerComponentProps {
  name: string;
}

export default FormWidget;
