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
import ImageWidget, { ImageWidgetProps } from "../widgets/ImageWidget";
import TableWidget, { TableWidgetProps } from "../widgets/TableWidget";
import FilePickerWidget, {
  FilePickerWidgetProps,
} from "../widgets/FilepickerWidget";
import DatePickerWidget, {
  DatePickerWidgetProps,
} from "../widgets/DatePickerWidget";
class WidgetBuilderRegistry {
  static registerWidgetBuilders() {
    WidgetFactory.registerWidgetBuilder(
      "CONTAINER_WIDGET",
      {
        buildWidget(
          widgetData: ContainerWidgetProps<WidgetProps>,
        ): JSX.Element {
          return <ContainerWidget {...widgetData} />;
        },
      },
      ContainerWidget.getPropertyValidationMap(),
    );

    WidgetFactory.registerWidgetBuilder(
      "TEXT_WIDGET",
      {
        buildWidget(widgetData: TextWidgetProps): JSX.Element {
          return <TextWidget {...widgetData} />;
        },
      },
      TextWidget.getPropertyValidationMap(),
    );

    WidgetFactory.registerWidgetBuilder(
      "BUTTON_WIDGET",
      {
        buildWidget(widgetData: ButtonWidgetProps): JSX.Element {
          return <ButtonWidget {...widgetData} />;
        },
      },
      ButtonWidget.getPropertyValidationMap(),
    );

    WidgetFactory.registerWidgetBuilder(
      "SPINNER_WIDGET",
      {
        buildWidget(widgetData: SpinnerWidgetProps): JSX.Element {
          return <SpinnerWidget {...widgetData} />;
        },
      },
      SpinnerWidget.getPropertyValidationMap(),
    );

    WidgetFactory.registerWidgetBuilder(
      "INPUT_WIDGET",
      {
        buildWidget(widgetData: InputWidgetProps): JSX.Element {
          return <InputWidget {...widgetData} />;
        },
      },
      InputWidget.getPropertyValidationMap(),
    );

    WidgetFactory.registerWidgetBuilder(
      "CHECKBOX_WIDGET",
      {
        buildWidget(widgetData: CheckboxWidgetProps): JSX.Element {
          return <CheckboxWidget {...widgetData} />;
        },
      },
      CheckboxWidget.getPropertyValidationMap(),
    );

    WidgetFactory.registerWidgetBuilder(
      "DROP_DOWN_WIDGET",
      {
        buildWidget(widgetData: DropdownWidgetProps): JSX.Element {
          return <DropdownWidget {...widgetData} />;
        },
      },
      DropdownWidget.getPropertyValidationMap(),
    );

    WidgetFactory.registerWidgetBuilder(
      "RADIO_GROUP_WIDGET",
      {
        buildWidget(widgetData: RadioGroupWidgetProps): JSX.Element {
          return <RadioGroupWidget {...widgetData} />;
        },
      },
      RadioGroupWidget.getPropertyValidationMap(),
    );

    WidgetFactory.registerWidgetBuilder(
      "IMAGE_WIDGET",
      {
        buildWidget(widgetData: ImageWidgetProps): JSX.Element {
          return <ImageWidget {...widgetData} />;
        },
      },
      ImageWidget.getPropertyValidationMap(),
    );
    WidgetFactory.registerWidgetBuilder(
      "TABLE_WIDGET",
      {
        buildWidget(widgetData: TableWidgetProps): JSX.Element {
          return <TableWidget {...widgetData} />;
        },
      },
      TableWidget.getPropertyValidationMap(),
    );
    WidgetFactory.registerWidgetBuilder(
      "FILE_PICKER_WIDGET",
      {
        buildWidget(widgetData: FilePickerWidgetProps): JSX.Element {
          return <FilePickerWidget {...widgetData} />;
        },
      },
      FilePickerWidget.getPropertyValidationMap(),
    );
    WidgetFactory.registerWidgetBuilder(
      "DATE_PICKER_WIDGET",
      {
        buildWidget(widgetData: DatePickerWidgetProps): JSX.Element {
          return <DatePickerWidget {...widgetData} />;
        },
      },
      DatePickerWidget.getPropertyValidationMap(),
    );
  }
}

export default WidgetBuilderRegistry;
