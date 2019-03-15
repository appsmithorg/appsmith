import BaseWidget, { IWidgetProps } from "../widgets/BaseWidget";
import ContainerWidget, {
  IContainerWidgetProps
} from "../widgets/ContainerWidget";
import TextWidget, { ITextWidgetProps } from "../widgets/TextWidget";
import InputTextWidget, {
  IInputTextWidgetProps
} from "../widgets/InputTextWidget";
import CalloutWidget, { ICalloutWidgetProps } from "../widgets/CalloutWidget";
import IconWidget, { IIconWidgetProps } from "../widgets/IconWidget";
import SpinnerWidget, { ISpinnerWidgetProps } from "../widgets/SpinnerWidget";
import WidgetFactory from "./WidgetFactory";
import React from "react";

class WidgetBuilderRegistry {
  static registerWidgetBuilders() {
    WidgetFactory.registerWidgetBuilder("CONTAINER_WIDGET", {
      buildWidget(
        widgetData: IContainerWidgetProps<IWidgetProps>
      ): JSX.Element {
        return <ContainerWidget {...widgetData} />;
      }
    });

    WidgetFactory.registerWidgetBuilder("TEXT_WIDGET", {
      buildWidget(widgetData: ITextWidgetProps): JSX.Element {
        return <TextWidget {...widgetData} />;
      }
    });

    WidgetFactory.registerWidgetBuilder("INPUT_TEXT_WIDGET", {
      buildWidget(widgetData: IInputTextWidgetProps): JSX.Element {
        return <InputTextWidget {...widgetData} />;
      }
    });

    WidgetFactory.registerWidgetBuilder("CALLOUT_WIDGET", {
      buildWidget(widgetData: ICalloutWidgetProps): JSX.Element {
        return <CalloutWidget {...widgetData} />;
      }
    });

    WidgetFactory.registerWidgetBuilder("ICON_WIDGET", {
      buildWidget(widgetData: IIconWidgetProps): JSX.Element {
        return <IconWidget {...widgetData} />;
      }
    });

    WidgetFactory.registerWidgetBuilder("SPINNER_WIDGET", {
      buildWidget(widgetData: ISpinnerWidgetProps): JSX.Element {
        return <SpinnerWidget {...widgetData} />;
      }
    });
  }
}

export default WidgetBuilderRegistry;
