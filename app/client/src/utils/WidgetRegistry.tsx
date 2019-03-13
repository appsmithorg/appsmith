import BaseWidget, { IWidgetProps } from "../widgets/BaseWidget";
import ContainerWidget, {
  IContainerWidgetProps
} from "../widgets/ContainerWidget";
import TextWidget, { ITextWidgetProps } from "../widgets/TextWidget";
import InputTextWidget, {
  IInputTextWidgetProps
} from "../widgets/InputTextWidget";
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
  }
}

export default WidgetBuilderRegistry;
