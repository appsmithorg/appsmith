import React from "react";
import _, { get, some, isEqual } from "lodash";
import { WidgetProps } from "../../BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import ContainerWidget, {
  ContainerWidgetProps,
} from "widgets/ContainerWidget/widget";
import { ContainerComponentProps } from "widgets/ContainerWidget/component";
import { CanvasWidgetStructure } from "widgets/constants";

class FormWidget extends ContainerWidget {
  checkInvalidChildren = (children: CanvasWidgetStructure[]): boolean => {
    return some(children, (child) => {
      if ("children" in child) {
        return this.checkInvalidChildren(child.children || []);
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

    // Check if the form is dirty
    const hasChanges = this.checkFormValueChanges(this.getChildContainer());

    if (hasChanges !== this.props.hasChanges) {
      this.props.updateWidgetMetaProperty("hasChanges", hasChanges);
    }
  }

  componentDidUpdate(prevProps: ContainerWidgetProps<any>) {
    super.componentDidUpdate(prevProps);
    this.updateFormData();
    // Check if the form is dirty
    const hasChanges = this.checkFormValueChanges(this.getChildContainer());

    if (hasChanges !== this.props.hasChanges) {
      this.props.updateWidgetMetaProperty("hasChanges", hasChanges);
    }
  }

  checkFormValueChanges(
    containerWidget: ContainerWidgetProps<WidgetProps>,
  ): boolean {
    const childWidgets = containerWidget.children || [];

    const hasChanges = childWidgets.some((child) => child.isDirty);
    if (!hasChanges) {
      return childWidgets.some(
        (child) =>
          child.children?.length &&
          this.checkFormValueChanges(get(child, "children[0]")),
      );
    }

    return hasChanges;
  }

  getChildContainer = () => {
    const { childWidgets = [] } = this.props;
    return childWidgets[0];
  };

  updateFormData() {
    const firstChild = this.getChildContainer();
    if (firstChild) {
      const formData = this.getFormData(firstChild);
      if (!isEqual(formData, this.props.data)) {
        this.props.updateWidgetMetaProperty("data", formData);
      }
    }
  }

  getFormData(formWidget: ContainerWidgetProps<WidgetProps>) {
    const formData: any = {};
    if (formWidget.children)
      formWidget.children.forEach((widgetData) => {
        if (!_.isNil(widgetData.value)) {
          formData[widgetData.widgetName] = widgetData.value;
        }
      });
    return formData;
  }

  renderChildWidget(childWidgetData: CanvasWidgetStructure): React.ReactNode {
    if (childWidgetData.children) {
      const isInvalid = this.checkInvalidChildren(childWidgetData.children);
      childWidgetData.children.forEach((grandChild: CanvasWidgetStructure) => {
        if (isInvalid) grandChild.isFormValid = false;
        // Add submit and reset handlers
        grandChild.onReset = this.handleResetInputs;
      });
    }
    return super.renderChildWidget(childWidgetData);
  }

  static getWidgetType(): WidgetType {
    return "FORM_WIDGET";
  }
}

export interface FormWidgetProps extends ContainerComponentProps {
  name: string;
  data: Record<string, unknown>;
  hasChanges: boolean;
}

export default FormWidget;
