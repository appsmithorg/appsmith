import { WidgetProps } from "../widgets/BaseWidget";
import ContainerWidget, {
  ContainerWidgetProps,
} from "../widgets/ContainerWidget";
import TextWidget, { TextWidgetProps } from "../widgets/TextWidget";
import InputGroupWidget, {
  InputGroupWidgetProps,
} from "../widgets/InputGroupWidget";
import CalloutWidget, { CalloutWidgetProps } from "../widgets/CalloutWidget";
// import IconWidget, { IconWidgetProps } from "../widgets/IconWidget";
import SpinnerWidget, { SpinnerWidgetProps } from "../widgets/SpinnerWidget";
// import BreadcrumbsWidget, {
//   BreadcrumbsWidgetProps,
// } from "../widgets/BreadcrumbsWidget";
// import TagInputWidget, { TagInputWidgetProps } from "../widgets/TagInputWidget";
// import NumericInputWidget, {
//   NumericInputWidgetProps,
// } from "../widgets/NumericInputWidget";
import CheckboxWidget, { CheckboxWidgetProps } from "../widgets/CheckboxWidget";
import RadioGroupWidget, {
  RadioGroupWidgetProps,
} from "../widgets/RadioGroupWidget";
import WidgetFactory from "./WidgetFactory";
import React from "react";
import ButtonWidget, { ButtonWidgetProps } from "../widgets/ButtonWidget";

class WidgetBuilderRegistry {
  static registerWidgetBuilders() {
    WidgetFactory.registerWidgetBuilder("CONTAINER_WIDGET", {
      buildWidget(widgetData: ContainerWidgetProps<WidgetProps>): JSX.Element {
        return <ContainerWidget {...widgetData} />;
      },
    });

    WidgetFactory.registerWidgetBuilder("TEXT_WIDGET", {
      buildWidget(widgetData: TextWidgetProps): JSX.Element {
        return <TextWidget {...widgetData} />;
      },
    });

    WidgetFactory.registerWidgetBuilder("BUTTON_WIDGET", {
      buildWidget(widgetData: ButtonWidgetProps): JSX.Element {
        return <ButtonWidget {...widgetData} />;
      },
    });

    WidgetFactory.registerWidgetBuilder("CALLOUT_WIDGET", {
      buildWidget(widgetData: CalloutWidgetProps): JSX.Element {
        return <CalloutWidget {...widgetData} />;
      },
    });

    WidgetFactory.registerWidgetBuilder("SPINNER_WIDGET", {
      buildWidget(widgetData: SpinnerWidgetProps): JSX.Element {
        return <SpinnerWidget {...widgetData} />;
      },
    });

    WidgetFactory.registerWidgetBuilder("INPUT_WIDGET", {
      buildWidget(widgetData: InputGroupWidgetProps): JSX.Element {
        return <InputGroupWidget {...widgetData} />;
      },
    });

    WidgetFactory.registerWidgetBuilder("CHECKBOX_WIDGET", {
      buildWidget(widgetData: CheckboxWidgetProps): JSX.Element {
        return <CheckboxWidget {...widgetData} />;
      },
    });

    WidgetFactory.registerWidgetBuilder("RADIO_BUTTON_WIDGET", {
      buildWidget(widgetData: RadioGroupWidgetProps): JSX.Element {
        return <RadioGroupWidget {...widgetData} />;
      },
    });
  }
}

export default WidgetBuilderRegistry;
