import React from "react";
import _ from "lodash";
import { WidgetProps } from "./NewBaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import ContainerWidget, { ContainerWidgetProps } from "widgets/ContainerWidget";
import ContainerComponent, {
  ContainerComponentProps,
} from "components/designSystems/appsmith/ContainerComponent";
import shallowEqual from "shallowequal";
import * as Sentry from "@sentry/react";
import WidgetFactory from "utils/WidgetFactory";

class FormWidget extends React.Component<ContainerWidgetProps, any> {
  // checkInvalidChildren = (children: WidgetProps[]): boolean => {
  //   return _.some(children, child => {
  //     if ("children" in child) return this.checkInvalidChildren(child.children);
  //     if ("isValid" in child) return !child.isValid;
  //     return false;
  //   });
  // };

  // handleResetInputs = () => {
  //   // this.props.resetChildrenMetaProperty(this.props.widgetId);
  // };

  // componentDidMount() {
  //   this.updateFormData();
  // }
  //
  // componentDidUpdate(prevProps: ContainerWidgetProps) {
  //   this.updateFormData();
  // }

  // updateFormData() {
  //   // if (this.props.children) {
  //   //   // const formData = this.getFormData(this.props.children[0]);
  //   //   if (JSON.stringify(formData) !== JSON.stringify(this.props.data)) {
  //   //     // this.props.updateWidgetMetaProperty("data", formData);
  //   //   }
  //   // }
  // }

  // getFormData(formWidget: any) {
  //   const formData: any = {};
  //   // TODO use the new ContainerWidgetProps
  //   // if (formWidget.children)
  //   //   formWidget.children.forEach((widgetData:) => {
  //   //     if (widgetData.value) {
  //   //       formData[widgetData.widgetName] = widgetData.value;
  //   //     }
  //   //   });
  //   return formData;
  // }

  // renderChildWidget(childWidgetData: WidgetProps): React.ReactNode {
  //   // if (childWidgetData.children) {
  //   //   const isInvalid = this.checkInvalidChildren(childWidgetData.children);
  //   //   childWidgetData.children.forEach((grandChild: WidgetProps) => {
  //   //     if (isInvalid) grandChild.isFormValid = false;
  //   //     // Add submit and reset handlers
  //   //     grandChild.onReset = this.handleResetInputs;
  //   //   });
  //   // }
  //   return WidgetFactory.createWidget(childWidgetData);
  // }

  renderChildren = () => {
    return this.props.children?.map(WidgetFactory.createWidget);
    // return _.map(
    //   // sort by row so stacking context is correct
    //   // TODO(abhinav): This is hacky. The stacking context should increase for widgets rendered top to bottom, always.
    //   // Figure out a way in which the stacking context is consistent.
    //   // _.sortBy(_.compact(this.props.children), child => child.topRow),
    //   this.renderChildWidget,
    // );
  };

  renderAsContainerComponent = (props: ContainerWidgetProps) => {
    return (
      <ContainerComponent {...props}>
        {this.renderChildren()}
      </ContainerComponent>
    );
  };

  render() {
    return this.renderAsContainerComponent(this.props);
  }

  getWidgetType(): WidgetType {
    return "FORM_WIDGET";
  }
}

export interface FormWidgetProps extends ContainerComponentProps {
  name: string;
  data: object;
}

export default FormWidget;
export const ProfiledFormWidget = Sentry.withProfiler(FormWidget);
