import BaseWidget, { WidgetProps } from "widgets/BaseWidget";
import { WidgetTypes } from "constants/WidgetConstants";
import ContainerWidget, {
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
import VideoWidget, {
  VideoWidgetProps,
  ProfiledVideoWidget,
} from "widgets/VideoWidget";
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
import FormWidget, { ProfiledFormWidget } from "widgets/FormWidget";
import FormButtonWidget, {
  FormButtonWidgetProps,
  ProfiledFormButtonWidget,
} from "widgets/FormButtonWidget";
import IconWidget, {
  IconWidgetProps,
  ProfiledIconWidget,
} from "widgets/IconWidget";

import CanvasWidget, { ProfiledCanvasWidget } from "widgets/CanvasWidget";
import SkeletonWidget, {
  ProfiledSkeletonWidget,
  SkeletonWidgetProps,
} from "../widgets/SkeletonWidget";
export default class WidgetBuilderRegistry {
  static registerWidgetBuilders() {
    WidgetFactory.registerWidgetBuilder(
      "CONTAINER_WIDGET",
      {
        buildWidget(
          widgetData: ContainerWidgetProps<WidgetProps>,
        ): JSX.Element {
          return <ProfiledContainerWidget {...widgetData} />;
        },
      },
      ContainerWidget.getPropertyValidationMap(),
      ContainerWidget.getDerivedPropertiesMap(),
      ContainerWidget.getTriggerPropertyMap(),
      ContainerWidget.getDefaultPropertiesMap(),
      ContainerWidget.getMetaPropertiesMap(),
    );

    WidgetFactory.registerWidgetBuilder(
      "TEXT_WIDGET",
      {
        buildWidget(widgetData: TextWidgetProps): JSX.Element {
          return <ProfiledTextWidget {...widgetData} />;
        },
      },
      TextWidget.getPropertyValidationMap(),
      TextWidget.getDerivedPropertiesMap(),
      TextWidget.getTriggerPropertyMap(),
      TextWidget.getDefaultPropertiesMap(),
      TextWidget.getMetaPropertiesMap(),
    );

    WidgetFactory.registerWidgetBuilder(
      "BUTTON_WIDGET",
      {
        buildWidget(widgetData: ButtonWidgetProps): JSX.Element {
          return <ProfiledButtonWidget {...widgetData} />;
        },
      },
      ButtonWidget.getPropertyValidationMap(),
      ButtonWidget.getDerivedPropertiesMap(),
      ButtonWidget.getTriggerPropertyMap(),
      ButtonWidget.getDefaultPropertiesMap(),
      ButtonWidget.getMetaPropertiesMap(),
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
      ImageWidget.getDerivedPropertiesMap(),
      ImageWidget.getTriggerPropertyMap(),
      ImageWidget.getDefaultPropertiesMap(),
      ImageWidget.getMetaPropertiesMap(),
    );
    WidgetFactory.registerWidgetBuilder(
      "TABLE_WIDGET",
      {
        buildWidget(widgetData: TableWidgetProps): JSX.Element {
          return <ProfiledTableWidget {...widgetData} />;
        },
      },
      TableWidget.getPropertyValidationMap(),
      TableWidget.getDerivedPropertiesMap(),
      TableWidget.getTriggerPropertyMap(),
      TableWidget.getDefaultPropertiesMap(),
      TableWidget.getMetaPropertiesMap(),
    );

    WidgetFactory.registerWidgetBuilder(
      "VIDEO_WIDGET",
      {
        buildWidget(widgetData: VideoWidgetProps): JSX.Element {
          return <ProfiledVideoWidget {...widgetData} />;
        },
      },
      VideoWidget.getPropertyValidationMap(),
      VideoWidget.getDerivedPropertiesMap(),
      VideoWidget.getTriggerPropertyMap(),
      VideoWidget.getDefaultPropertiesMap(),
      VideoWidget.getMetaPropertiesMap(),
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
      FilePickerWidget.getDefaultPropertiesMap(),
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
      TabsWidget.getMetaPropertiesMap(),
    );
    WidgetFactory.registerWidgetBuilder(
      WidgetTypes.MODAL_WIDGET,
      {
        buildWidget(widgetProps: ModalWidgetProps): JSX.Element {
          return <ProfiledModalWidget {...widgetProps} />;
        },
      },
      BaseWidget.getPropertyValidationMap(),
      BaseWidget.getDerivedPropertiesMap(),
      BaseWidget.getTriggerPropertyMap(),
      BaseWidget.getDefaultPropertiesMap(),
      BaseWidget.getMetaPropertiesMap(),
    );
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
      ChartWidget.getDerivedPropertiesMap(),
      ChartWidget.getTriggerPropertyMap(),
      ChartWidget.getDefaultPropertiesMap(),
      ChartWidget.getMetaPropertiesMap(),
    );
    WidgetFactory.registerWidgetBuilder(
      "FORM_WIDGET",
      {
        buildWidget(
          widgetProps: ContainerWidgetProps<WidgetProps>,
        ): JSX.Element {
          return <ProfiledFormWidget {...widgetProps} />;
        },
      },
      FormWidget.getPropertyValidationMap(),
      FormWidget.getDerivedPropertiesMap(),
      FormWidget.getTriggerPropertyMap(),
      FormWidget.getDefaultPropertiesMap(),
      FormWidget.getMetaPropertiesMap(),
    );

    WidgetFactory.registerWidgetBuilder(
      "FORM_BUTTON_WIDGET",
      {
        buildWidget(widgetProps: FormButtonWidgetProps): JSX.Element {
          return <ProfiledFormButtonWidget {...widgetProps} />;
        },
      },
      FormButtonWidget.getPropertyValidationMap(),
      FormButtonWidget.getDerivedPropertiesMap(),
      FormButtonWidget.getTriggerPropertyMap(),
      FormButtonWidget.getDefaultPropertiesMap(),
      FormButtonWidget.getMetaPropertiesMap(),
    );

    WidgetFactory.registerWidgetBuilder(
      "MAP_WIDGET",
      {
        buildWidget(widgetProps: MapWidgetProps): JSX.Element {
          return <ProfiledMapWidget {...widgetProps} />;
        },
      },
      MapWidget.getPropertyValidationMap(),
      MapWidget.getDerivedPropertiesMap(),
      MapWidget.getTriggerPropertyMap(),
      MapWidget.getDefaultPropertiesMap(),
      MapWidget.getMetaPropertiesMap(),
    );

    WidgetFactory.registerWidgetBuilder(
      WidgetTypes.CANVAS_WIDGET,
      {
        buildWidget(
          widgetData: ContainerWidgetProps<WidgetProps>,
        ): JSX.Element {
          return <ProfiledCanvasWidget {...widgetData} />;
        },
      },
      CanvasWidget.getPropertyValidationMap(),
      CanvasWidget.getDerivedPropertiesMap(),
      CanvasWidget.getTriggerPropertyMap(),
      CanvasWidget.getDefaultPropertiesMap(),
      CanvasWidget.getMetaPropertiesMap(),
    );

    WidgetFactory.registerWidgetBuilder(
      WidgetTypes.ICON_WIDGET,
      {
        buildWidget(widgetProps: IconWidgetProps): JSX.Element {
          return <ProfiledIconWidget {...widgetProps} />;
        },
      },
      IconWidget.getPropertyValidationMap(),
      IconWidget.getDerivedPropertiesMap(),
      IconWidget.getTriggerPropertyMap(),
      IconWidget.getDefaultPropertiesMap(),
      IconWidget.getMetaPropertiesMap(),
    );

    WidgetFactory.registerWidgetBuilder(
      WidgetTypes.SKELETON_WIDGET,
      {
        buildWidget(widgetProps: SkeletonWidgetProps): JSX.Element {
          return <ProfiledSkeletonWidget {...widgetProps} />;
        },
      },
      SkeletonWidget.getPropertyValidationMap(),
      SkeletonWidget.getDerivedPropertiesMap(),
      SkeletonWidget.getTriggerPropertyMap(),
      SkeletonWidget.getDefaultPropertiesMap(),
      SkeletonWidget.getMetaPropertiesMap(),
    );
  }
}
