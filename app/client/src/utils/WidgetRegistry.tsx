import { WidgetProps } from "../widgets/BaseWidget";
import ContainerWidget, {
  ContainerWidgetProps,
} from "../widgets/ContainerWidget";
import TextWidget, { TextWidgetProps } from "../widgets/TextWidget";
import InputWidget, { InputWidgetProps } from "../widgets/InputWidget";
import SpinnerWidget, { SpinnerWidgetProps } from "../widgets/SpinnerWidget";
import CheckboxWidget, { CheckboxWidgetProps } from "../widgets/CheckboxWidget";
import RadioGroupWidget, {
  RadioGroupWidgetProps,
} from "../widgets/RadioGroupWidget";
import WidgetFactory from "./WidgetFactory";
import React from "react";
import ButtonWidget, { ButtonWidgetProps } from "../widgets/ButtonWidget";
import DropdownWidget, { DropdownWidgetProps } from "../widgets/DropdownWidget";

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

    WidgetFactory.registerWidgetBuilder("SPINNER_WIDGET", {
      buildWidget(widgetData: SpinnerWidgetProps): JSX.Element {
        return <SpinnerWidget {...widgetData} />;
      },
    });

    WidgetFactory.registerWidgetBuilder("INPUT_WIDGET", {
      buildWidget(widgetData: InputWidgetProps): JSX.Element {
        return <InputWidget {...widgetData} />;
      },
    });

    WidgetFactory.registerWidgetBuilder("CHECKBOX_WIDGET", {
      buildWidget(widgetData: CheckboxWidgetProps): JSX.Element {
        return <CheckboxWidget {...widgetData} />;
      },
    });

    WidgetFactory.registerWidgetBuilder("DROP_DOWN_WIDGET", {
      buildWidget(widgetData: DropdownWidgetProps): JSX.Element {
        return <DropdownWidget {...widgetData} />;
      },
    });

    WidgetFactory.registerWidgetBuilder("RADIO_GROUP_WIDGET", {
      buildWidget(widgetData: RadioGroupWidgetProps): JSX.Element {
        return <RadioGroupWidget {...widgetData} />;
      },
    });

    WidgetFactory.registerWidgetBuilder("DROP_DOWN_WIDGET", {
      buildWidget(widgetData: DropdownWidgetProps): JSX.Element {
        return <DropdownWidget {...widgetData} />;
      },
    });
  }
}

export default WidgetBuilderRegistry;
