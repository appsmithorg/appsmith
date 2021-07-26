import React from "react";
import _ from "lodash";
import { WidgetProps } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import ContainerWidget, { ContainerWidgetProps } from "widgets/ContainerWidget";
import { ContainerComponentProps } from "components/designSystems/appsmith/ContainerComponent";
import * as Sentry from "@sentry/react";
import withMeta from "./MetaHOC";
import { ValidationTypes } from "constants/WidgetValidation";

class FormWidget extends ContainerWidget {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "backgroundColor",
            label: "Background Color",
            helpText: "Use a html color name, HEX, RGB or RGBA value",
            placeholderText: "#FFFFFF / Gray / rgb(255, 99, 71)",
            controlType: "COLOR_PICKER",
            isBindProperty: true,
            isJSConvertible: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Controls the visibility of the widget",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "shouldScrollContents",
            label: "Scroll Contents",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
        ],
      },
    ];
  }
  checkInvalidChildren = (children: WidgetProps[]): boolean => {
    return _.some(children, (child) => {
      if ("children" in child) {
        return this.checkInvalidChildren(child.children);
      }
      if ("isValid" in child) {
        return !child.isValid;
      }
      return false;
    });
  };

  handleResetInputs = () => {
    super.resetChildrenMetaProperty(this.props.widgetId);
  };

  componentDidMount() {
    super.componentDidMount();
    this.updateFormData();
  }

  componentDidUpdate(prevProps: ContainerWidgetProps<any>) {
    super.componentDidUpdate(prevProps);
    this.updateFormData();
  }

  updateFormData() {
    if (this.props.children) {
      const formData = this.getFormData(this.props.children[0] as WidgetProps);
      if (!_.isEqual(formData, this.props.data)) {
        this.props.updateWidgetMetaProperty("data", formData);
      }
    }
  }

  getFormData(formWidget: ContainerWidgetProps<WidgetProps>) {
    const formData: any = {};
    if (formWidget.children)
      formWidget.children.forEach((widgetData) => {
        if (widgetData.value) {
          formData[widgetData.widgetName] = widgetData.value;
        }
      });
    return formData;
  }

  renderChildWidget(childWidgetData: WidgetProps): React.ReactNode {
    if (childWidgetData.children) {
      const isInvalid = this.checkInvalidChildren(childWidgetData.children);
      childWidgetData.children.forEach((grandChild: WidgetProps) => {
        if (isInvalid) grandChild.isFormValid = false;
        // Add submit and reset handlers
        grandChild.onReset = this.handleResetInputs;
      });
    }
    return super.renderChildWidget(childWidgetData);
  }

  getWidgetType(): WidgetType {
    return "FORM_WIDGET";
  }
}

export interface FormWidgetProps extends ContainerComponentProps {
  name: string;
  data: Record<string, unknown>;
}

export default FormWidget;
export const ProfiledFormWidget = Sentry.withProfiler(withMeta(FormWidget));
