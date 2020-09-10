import { WidgetProps } from "widgets/NewBaseWidget";
import { WidgetTypes } from "constants/WidgetConstants";
import {
  ContainerWidgetProps,
  ProfiledContainerWidget,
} from "widgets/ContainerWidget";
import TextWidget, {
  TextWidgetProps,
  ProfiledTextWidget,
} from "widgets/TextWidget";
import InputWidget, {
  InputWidgetProps,
  ProfiledInputWidget,
} from "widgets/InputWidget";
import CheckboxWidget, {
  CheckboxWidgetProps,
  ProfiledCheckboxWidget,
} from "widgets/CheckboxWidget";
import RadioGroupWidget, {
  RadioGroupWidgetProps,
  ProfiledRadioGroupWidget,
} from "widgets/RadioGroupWidget";
import WidgetFactory from "./WidgetFactory";
import React from "react";
import ButtonWidget, {
  ButtonWidgetProps,
  ProfiledButtonWidget,
} from "widgets/ButtonWidget";
import DropdownWidget, {
  DropdownWidgetProps,
  ProfiledDropDownWidget,
} from "widgets/DropdownWidget";
import ImageWidget, {
  ImageWidgetProps,
  ProfiledImageWidget,
} from "widgets/ImageWidget";
import TableWidget, {
  TableWidgetProps,
  ProfiledTableWidget,
} from "widgets/TableWidget";
import TabsWidget, {
  TabsWidgetProps,
  TabContainerWidgetProps,
  ProfiledTabsWidget,
} from "widgets/TabsWidget";
import { ModalWidgetProps, ProfiledModalWidget } from "widgets/ModalWidget";
import RichTextEditorWidget, {
  RichTextEditorWidgetProps,
  ProfiledRichTextEditorWidget,
} from "widgets/RichTextEditorWidget";
import ChartWidget, {
  ChartWidgetProps,
  ProfiledChartWidget,
} from "widgets/ChartWidget";
import MapWidget, {
  MapWidgetProps,
  ProfiledMapWidget,
} from "widgets/MapWidget";

import FilePickerWidget, {
  FilePickerWidgetProps,
  ProfiledFilePickerWidget,
} from "widgets/FilepickerWidget";
import DatePickerWidget, {
  DatePickerWidgetProps,
  ProfiledDatePickerWidget,
} from "widgets/DatePickerWidget";
import { ProfiledFormWidget } from "widgets/FormWidget";
import FormButtonWidget, {
  FormButtonWidgetProps,
  ProfiledFormButtonWidget,
} from "widgets/FormButtonWidget";
import IconWidget, {
  IconWidgetProps,
  ProfiledIconWidget,
} from "widgets/IconWidget";

import CanvasWidget, { ProfiledCanvasWidget } from "widgets/CanvasWidget";
export default class WidgetBuilderRegistry {
  static registerWidgetBuilders() {
    WidgetFactory.registerWidgetBuilder("CONTAINER_WIDGET", {
      buildWidget(widgetData: ContainerWidgetProps): JSX.Element {
        return <ProfiledContainerWidget {...widgetData} />;
      },
    });

    WidgetFactory.registerWidgetBuilder(
      "TEXT_WIDGET",
      {
        buildWidget(widgetData: TextWidgetProps): JSX.Element {
          return <ProfiledTextWidget {...widgetData} />;
        },
      },
      TextWidget.getPropertyValidationMap(),
      TextWidget.getDerivedPropertiesMap(),
    );

    WidgetFactory.registerWidgetBuilder(
      "BUTTON_WIDGET",
      {
        buildWidget(widgetData: ButtonWidgetProps): JSX.Element {
          return <ProfiledButtonWidget {...widgetData} />;
        },
      },
      ButtonWidget.getPropertyValidationMap(),
      undefined,
      ButtonWidget.getTriggerPropertyMap(),
    );

    WidgetFactory.registerWidgetBuilder(
      "INPUT_WIDGET",
      {
        buildWidget(widgetData: InputWidgetProps): JSX.Element {
          return <ProfiledInputWidget {...widgetData} />;
        },
      },
      InputWidget.getPropertyValidationMap(),
      InputWidget.getDerivedPropertiesMap(),
      InputWidget.getTriggerPropertyMap(),
      InputWidget.getDefaultPropertiesMap(),
      InputWidget.getMetaPropertiesMap(),
    );

    WidgetFactory.registerWidgetBuilder(
      "CHECKBOX_WIDGET",
      {
        buildWidget(widgetData: CheckboxWidgetProps): JSX.Element {
          return <ProfiledCheckboxWidget {...widgetData} />;
        },
      },
      CheckboxWidget.getPropertyValidationMap(),
      CheckboxWidget.getDerivedPropertiesMap(),
      CheckboxWidget.getTriggerPropertyMap(),
      CheckboxWidget.getDefaultPropertiesMap(),
      CheckboxWidget.getMetaPropertiesMap(),
    );

    WidgetFactory.registerWidgetBuilder(
      "DROP_DOWN_WIDGET",
      {
        buildWidget(widgetData: DropdownWidgetProps): JSX.Element {
          return <ProfiledDropDownWidget {...widgetData} />;
        },
      },
      DropdownWidget.getPropertyValidationMap(),
      DropdownWidget.getDerivedPropertiesMap(),
      DropdownWidget.getTriggerPropertyMap(),
      DropdownWidget.getDefaultPropertiesMap(),
      DropdownWidget.getMetaPropertiesMap(),
    );

    WidgetFactory.registerWidgetBuilder(
      "RADIO_GROUP_WIDGET",
      {
        buildWidget(widgetData: RadioGroupWidgetProps): JSX.Element {
          return <ProfiledRadioGroupWidget {...widgetData} />;
        },
      },
      RadioGroupWidget.getPropertyValidationMap(),
      RadioGroupWidget.getDerivedPropertiesMap(),
      RadioGroupWidget.getTriggerPropertyMap(),
      RadioGroupWidget.getDefaultPropertiesMap(),
      RadioGroupWidget.getMetaPropertiesMap(),
    );

    WidgetFactory.registerWidgetBuilder(
      "IMAGE_WIDGET",
      {
        buildWidget(widgetData: ImageWidgetProps): JSX.Element {
          return <ProfiledImageWidget {...widgetData} />;
        },
      },
      ImageWidget.getPropertyValidationMap(),
    );
    WidgetFactory.registerWidgetBuilder(
      "TABLE_WIDGET",
      {
        buildWidget(widgetData: TableWidgetProps): JSX.Element {
          return <ProfiledTableWidget {...widgetData} />;
        },
      },
      TableWidget.getPropertyValidationMap(),
      undefined,
      TableWidget.getTriggerPropertyMap(),
      TableWidget.getDefaultPropertiesMap(),
      TableWidget.getMetaPropertiesMap(),
    );
    WidgetFactory.registerWidgetBuilder(
      "FILE_PICKER_WIDGET",
      {
        buildWidget(widgetData: FilePickerWidgetProps): JSX.Element {
          return <ProfiledFilePickerWidget {...widgetData} />;
        },
      },
      FilePickerWidget.getPropertyValidationMap(),
      FilePickerWidget.getDerivedPropertiesMap(),
      FilePickerWidget.getTriggerPropertyMap(),
      undefined,
      FilePickerWidget.getMetaPropertiesMap(),
    );
    WidgetFactory.registerWidgetBuilder(
      "DATE_PICKER_WIDGET",
      {
        buildWidget(widgetData: DatePickerWidgetProps): JSX.Element {
          return <ProfiledDatePickerWidget {...widgetData} />;
        },
      },
      DatePickerWidget.getPropertyValidationMap(),
      DatePickerWidget.getDerivedPropertiesMap(),
      DatePickerWidget.getTriggerPropertyMap(),
      DatePickerWidget.getDefaultPropertiesMap(),
      DatePickerWidget.getMetaPropertiesMap(),
    );
    WidgetFactory.registerWidgetBuilder(
      "TABS_WIDGET",
      {
        buildWidget(
          widgetProps: TabsWidgetProps<TabContainerWidgetProps>,
        ): JSX.Element {
          return <ProfiledTabsWidget {...widgetProps} />;
        },
      },
      TabsWidget.getPropertyValidationMap(),
      TabsWidget.getDerivedPropertiesMap(),
      TabsWidget.getTriggerPropertyMap(),
      TabsWidget.getDefaultPropertiesMap(),
    );
    WidgetFactory.registerWidgetBuilder(WidgetTypes.MODAL_WIDGET, {
      buildWidget(widgetProps: ModalWidgetProps): JSX.Element {
        return <ProfiledModalWidget {...widgetProps} />;
      },
    });
    WidgetFactory.registerWidgetBuilder(
      "RICH_TEXT_EDITOR_WIDGET",
      {
        buildWidget(widgetData: RichTextEditorWidgetProps): JSX.Element {
          return <ProfiledRichTextEditorWidget {...widgetData} />;
        },
      },
      RichTextEditorWidget.getPropertyValidationMap(),
      RichTextEditorWidget.getDerivedPropertiesMap(),
      RichTextEditorWidget.getTriggerPropertyMap(),
      RichTextEditorWidget.getDefaultPropertiesMap(),
      RichTextEditorWidget.getMetaPropertiesMap(),
    );
    WidgetFactory.registerWidgetBuilder(
      "CHART_WIDGET",
      {
        buildWidget(widgetData: ChartWidgetProps): JSX.Element {
          return <ProfiledChartWidget {...widgetData} />;
        },
      },
      ChartWidget.getPropertyValidationMap(),
    );
    WidgetFactory.registerWidgetBuilder("FORM_WIDGET", {
      buildWidget(widgetProps: ContainerWidgetProps): JSX.Element {
        return <ProfiledFormWidget {...widgetProps} />;
      },
    });

    WidgetFactory.registerWidgetBuilder(
      "FORM_BUTTON_WIDGET",
      {
        buildWidget(widgetProps: FormButtonWidgetProps): JSX.Element {
          return <ProfiledFormButtonWidget {...widgetProps} />;
        },
      },
      FormButtonWidget.getPropertyValidationMap(),
      undefined,
      FormButtonWidget.getTriggerPropertyMap(),
    );

    WidgetFactory.registerWidgetBuilder(
      "MAP_WIDGET",
      {
        buildWidget(widgetProps: MapWidgetProps): JSX.Element {
          return <ProfiledMapWidget {...widgetProps} />;
        },
      },
      MapWidget.getPropertyValidationMap(),
      undefined,
      MapWidget.getTriggerPropertyMap(),
      MapWidget.getDefaultPropertiesMap(),
      MapWidget.getMetaPropertiesMap(),
    );

    WidgetFactory.registerWidgetBuilder(WidgetTypes.CANVAS_WIDGET, {
      buildWidget(widgetData: ContainerWidgetProps): JSX.Element {
        return <ProfiledCanvasWidget {...widgetData} />;
      },
    });

    WidgetFactory.registerWidgetBuilder(
      WidgetTypes.ICON_WIDGET,
      {
        buildWidget(widgetProps: IconWidgetProps): JSX.Element {
          return <ProfiledIconWidget {...widgetProps} />;
        },
      },
      undefined,
      undefined,
      IconWidget.getTriggerPropertyMap(),
    );
  }
}
