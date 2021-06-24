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
import TableWidget, { ProfiledTableWidget } from "widgets/TableWidget";
import { TableWidgetProps } from "widgets/TableWidget/TableWidgetConstants";
import VideoWidget, {
  VideoWidgetProps,
  ProfiledVideoWidget,
} from "widgets/VideoWidget";
import TabsWidget, {
  TabsWidgetProps,
  TabContainerWidgetProps,
  ProfiledTabsWidget,
} from "widgets/Tabs/TabsWidget";
import {
  ModalWidgetProps,
  ProfiledModalWidget,
  ModalWidget,
} from "widgets/ModalWidget";
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
import DatePickerWidget2, {
  DatePickerWidget2Props,
  ProfiledDatePickerWidget2,
} from "widgets/DatePickerWidget2";
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

import ListWidget, {
  ListWidgetProps,
  ProfiledListWidget,
} from "widgets/ListWidget/ListWidget";

import SwitchWidget, {
  ProfiledSwitchWidget,
  SwitchWidgetProps,
} from "widgets/SwitchWidget";
import TabsMigratorWidget, {
  ProfiledTabsMigratorWidget,
} from "widgets/Tabs/TabsMigrator";
import IframeWidget, {
  IframeWidgetProps,
  ProfiledIframeWidget,
} from "widgets/IframeWidget";

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
      ContainerWidget.getDerivedPropertiesMap(),
      ContainerWidget.getDefaultPropertiesMap(),
      ContainerWidget.getMetaPropertiesMap(),
      ContainerWidget.getPropertyPaneConfig(),
    );

    WidgetFactory.registerWidgetBuilder(
      "TEXT_WIDGET",
      {
        buildWidget(widgetData: TextWidgetProps): JSX.Element {
          return <ProfiledTextWidget {...widgetData} />;
        },
      },
      TextWidget.getDerivedPropertiesMap(),
      TextWidget.getDefaultPropertiesMap(),
      TextWidget.getMetaPropertiesMap(),
      TextWidget.getPropertyPaneConfig(),
    );

    WidgetFactory.registerWidgetBuilder(
      "BUTTON_WIDGET",
      {
        buildWidget(widgetData: ButtonWidgetProps): JSX.Element {
          return <ProfiledButtonWidget {...widgetData} />;
        },
      },
      ButtonWidget.getDerivedPropertiesMap(),
      ButtonWidget.getDefaultPropertiesMap(),
      ButtonWidget.getMetaPropertiesMap(),
      ButtonWidget.getPropertyPaneConfig(),
    );

    WidgetFactory.registerWidgetBuilder(
      "INPUT_WIDGET",
      {
        buildWidget(widgetData: InputWidgetProps): JSX.Element {
          return <ProfiledInputWidget {...widgetData} />;
        },
      },
      InputWidget.getDerivedPropertiesMap(),
      InputWidget.getDefaultPropertiesMap(),
      InputWidget.getMetaPropertiesMap(),
      InputWidget.getPropertyPaneConfig(),
    );

    WidgetFactory.registerWidgetBuilder(
      "CHECKBOX_WIDGET",
      {
        buildWidget(widgetData: CheckboxWidgetProps): JSX.Element {
          return <ProfiledCheckboxWidget {...widgetData} />;
        },
      },
      CheckboxWidget.getDerivedPropertiesMap(),
      CheckboxWidget.getDefaultPropertiesMap(),
      CheckboxWidget.getMetaPropertiesMap(),
      CheckboxWidget.getPropertyPaneConfig(),
    );

    WidgetFactory.registerWidgetBuilder(
      "SWITCH_WIDGET",
      {
        buildWidget(widgetData: SwitchWidgetProps): JSX.Element {
          return <ProfiledSwitchWidget {...widgetData} />;
        },
      },
      SwitchWidget.getDerivedPropertiesMap(),
      SwitchWidget.getDefaultPropertiesMap(),
      SwitchWidget.getMetaPropertiesMap(),
      SwitchWidget.getPropertyPaneConfig(),
    );

    WidgetFactory.registerWidgetBuilder(
      "DROP_DOWN_WIDGET",
      {
        buildWidget(widgetData: DropdownWidgetProps): JSX.Element {
          return <ProfiledDropDownWidget {...widgetData} />;
        },
      },
      DropdownWidget.getDerivedPropertiesMap(),
      DropdownWidget.getDefaultPropertiesMap(),
      DropdownWidget.getMetaPropertiesMap(),
      DropdownWidget.getPropertyPaneConfig(),
    );

    WidgetFactory.registerWidgetBuilder(
      "RADIO_GROUP_WIDGET",
      {
        buildWidget(widgetData: RadioGroupWidgetProps): JSX.Element {
          return <ProfiledRadioGroupWidget {...widgetData} />;
        },
      },
      RadioGroupWidget.getDerivedPropertiesMap(),
      RadioGroupWidget.getDefaultPropertiesMap(),
      RadioGroupWidget.getMetaPropertiesMap(),
      RadioGroupWidget.getPropertyPaneConfig(),
    );

    WidgetFactory.registerWidgetBuilder(
      "IMAGE_WIDGET",
      {
        buildWidget(widgetData: ImageWidgetProps): JSX.Element {
          return <ProfiledImageWidget {...widgetData} />;
        },
      },
      ImageWidget.getDerivedPropertiesMap(),
      ImageWidget.getDefaultPropertiesMap(),
      ImageWidget.getMetaPropertiesMap(),
      ImageWidget.getPropertyPaneConfig(),
    );
    WidgetFactory.registerWidgetBuilder(
      "TABLE_WIDGET",
      {
        buildWidget(widgetData: TableWidgetProps): JSX.Element {
          return <ProfiledTableWidget {...widgetData} />;
        },
      },
      TableWidget.getDerivedPropertiesMap(),
      TableWidget.getDefaultPropertiesMap(),
      TableWidget.getMetaPropertiesMap(),
      TableWidget.getPropertyPaneConfig(),
    );

    WidgetFactory.registerWidgetBuilder(
      "VIDEO_WIDGET",
      {
        buildWidget(widgetData: VideoWidgetProps): JSX.Element {
          return <ProfiledVideoWidget {...widgetData} />;
        },
      },
      VideoWidget.getDerivedPropertiesMap(),
      VideoWidget.getDefaultPropertiesMap(),
      VideoWidget.getMetaPropertiesMap(),
      VideoWidget.getPropertyPaneConfig(),
    );

    WidgetFactory.registerWidgetBuilder(
      "FILE_PICKER_WIDGET",
      {
        buildWidget(widgetData: FilePickerWidgetProps): JSX.Element {
          return <ProfiledFilePickerWidget {...widgetData} />;
        },
      },
      FilePickerWidget.getDerivedPropertiesMap(),
      FilePickerWidget.getDefaultPropertiesMap(),
      FilePickerWidget.getMetaPropertiesMap(),
      FilePickerWidget.getPropertyPaneConfig(),
    );
    WidgetFactory.registerWidgetBuilder(
      "DATE_PICKER_WIDGET",
      {
        buildWidget(widgetData: DatePickerWidgetProps): JSX.Element {
          return <ProfiledDatePickerWidget {...widgetData} />;
        },
      },
      DatePickerWidget.getDerivedPropertiesMap(),
      DatePickerWidget.getDefaultPropertiesMap(),
      DatePickerWidget.getMetaPropertiesMap(),
      DatePickerWidget.getPropertyPaneConfig(),
    );
    WidgetFactory.registerWidgetBuilder(
      "DATE_PICKER_WIDGET2",
      {
        buildWidget(widgetData: DatePickerWidget2Props): JSX.Element {
          return <ProfiledDatePickerWidget2 {...widgetData} />;
        },
      },
      DatePickerWidget2.getDerivedPropertiesMap(),
      DatePickerWidget2.getDefaultPropertiesMap(),
      DatePickerWidget2.getMetaPropertiesMap(),
      DatePickerWidget2.getPropertyPaneConfig(),
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
      TabsWidget.getDerivedPropertiesMap(),
      TabsWidget.getDefaultPropertiesMap(),
      TabsWidget.getMetaPropertiesMap(),
      TabsWidget.getPropertyPaneConfig(),
    );
    WidgetFactory.registerWidgetBuilder(
      "TABS_MIGRATOR_WIDGET",
      {
        buildWidget(
          widgetProps: TabsWidgetProps<TabContainerWidgetProps>,
        ): JSX.Element {
          return <ProfiledTabsMigratorWidget {...widgetProps} />;
        },
      },
      TabsMigratorWidget.getDerivedPropertiesMap(),
      TabsMigratorWidget.getDefaultPropertiesMap(),
      TabsMigratorWidget.getMetaPropertiesMap(),
      TabsMigratorWidget.getPropertyPaneConfig(),
    );
    WidgetFactory.registerWidgetBuilder(
      WidgetTypes.MODAL_WIDGET,
      {
        buildWidget(widgetProps: ModalWidgetProps): JSX.Element {
          return <ProfiledModalWidget {...widgetProps} />;
        },
      },
      BaseWidget.getDerivedPropertiesMap(),
      BaseWidget.getDefaultPropertiesMap(),
      BaseWidget.getMetaPropertiesMap(),
      ModalWidget.getPropertyPaneConfig(),
    );
    WidgetFactory.registerWidgetBuilder(
      "RICH_TEXT_EDITOR_WIDGET",
      {
        buildWidget(widgetData: RichTextEditorWidgetProps): JSX.Element {
          return <ProfiledRichTextEditorWidget {...widgetData} />;
        },
      },
      RichTextEditorWidget.getDerivedPropertiesMap(),
      RichTextEditorWidget.getDefaultPropertiesMap(),
      RichTextEditorWidget.getMetaPropertiesMap(),
      RichTextEditorWidget.getPropertyPaneConfig(),
    );
    WidgetFactory.registerWidgetBuilder(
      "CHART_WIDGET",
      {
        buildWidget(widgetData: ChartWidgetProps): JSX.Element {
          return <ProfiledChartWidget {...widgetData} />;
        },
      },
      ChartWidget.getDerivedPropertiesMap(),
      ChartWidget.getDefaultPropertiesMap(),
      ChartWidget.getMetaPropertiesMap(),
      ChartWidget.getPropertyPaneConfig(),
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
      FormWidget.getDerivedPropertiesMap(),
      FormWidget.getDefaultPropertiesMap(),
      FormWidget.getMetaPropertiesMap(),
      FormWidget.getPropertyPaneConfig(),
    );

    WidgetFactory.registerWidgetBuilder(
      "FORM_BUTTON_WIDGET",
      {
        buildWidget(widgetProps: FormButtonWidgetProps): JSX.Element {
          return <ProfiledFormButtonWidget {...widgetProps} />;
        },
      },
      FormButtonWidget.getDerivedPropertiesMap(),
      FormButtonWidget.getDefaultPropertiesMap(),
      FormButtonWidget.getMetaPropertiesMap(),
      FormButtonWidget.getPropertyPaneConfig(),
    );

    WidgetFactory.registerWidgetBuilder(
      "MAP_WIDGET",
      {
        buildWidget(widgetProps: MapWidgetProps): JSX.Element {
          return <ProfiledMapWidget {...widgetProps} />;
        },
      },
      MapWidget.getDerivedPropertiesMap(),
      MapWidget.getDefaultPropertiesMap(),
      MapWidget.getMetaPropertiesMap(),
      MapWidget.getPropertyPaneConfig(),
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
      CanvasWidget.getDerivedPropertiesMap(),
      CanvasWidget.getDefaultPropertiesMap(),
      CanvasWidget.getMetaPropertiesMap(),
      CanvasWidget.getPropertyPaneConfig(),
    );

    WidgetFactory.registerWidgetBuilder(
      WidgetTypes.ICON_WIDGET,
      {
        buildWidget(widgetProps: IconWidgetProps): JSX.Element {
          return <ProfiledIconWidget {...widgetProps} />;
        },
      },
      IconWidget.getDerivedPropertiesMap(),
      IconWidget.getDefaultPropertiesMap(),
      IconWidget.getMetaPropertiesMap(),
      IconWidget.getPropertyPaneConfig(),
    );

    WidgetFactory.registerWidgetBuilder(
      WidgetTypes.SKELETON_WIDGET,
      {
        buildWidget(widgetProps: SkeletonWidgetProps): JSX.Element {
          return <ProfiledSkeletonWidget {...widgetProps} />;
        },
      },
      SkeletonWidget.getDerivedPropertiesMap(),
      SkeletonWidget.getDefaultPropertiesMap(),
      SkeletonWidget.getMetaPropertiesMap(),
      SkeletonWidget.getPropertyPaneConfig(),
    );
    WidgetFactory.registerWidgetBuilder(
      WidgetTypes.LIST_WIDGET,
      {
        buildWidget(widgetProps: ListWidgetProps<WidgetProps>): JSX.Element {
          return <ProfiledListWidget {...widgetProps} />;
        },
      },
      ListWidget.getDerivedPropertiesMap(),
      ListWidget.getDefaultPropertiesMap(),
      ListWidget.getMetaPropertiesMap(),
      ListWidget.getPropertyPaneConfig(),
    );
    WidgetFactory.registerWidgetBuilder(
      WidgetTypes.MODAL_WIDGET,
      {
        buildWidget(widgetData: ModalWidgetProps): JSX.Element {
          return <ProfiledModalWidget {...widgetData} />;
        },
      },
      ModalWidget.getDerivedPropertiesMap(),
      ModalWidget.getDefaultPropertiesMap(),
      ModalWidget.getMetaPropertiesMap(),
      ModalWidget.getPropertyPaneConfig(),
    );

    WidgetFactory.registerWidgetBuilder(
      WidgetTypes.IFRAME_WIDGET,
      {
        buildWidget(widgetData: IframeWidgetProps): JSX.Element {
          return <ProfiledIframeWidget {...widgetData} />;
        },
      },
      IframeWidget.getDerivedPropertiesMap(),
      IframeWidget.getDefaultPropertiesMap(),
      IframeWidget.getMetaPropertiesMap(),
      IframeWidget.getPropertyPaneConfig(),
    );
  }
}
