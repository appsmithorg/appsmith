import type React from "react";
import _, { get, some } from "lodash";
import equal from "fast-deep-equal/es6";
import type { WidgetProps } from "../../BaseWidget";
import type { ContainerWidgetProps } from "widgets/ContainerWidget/widget";
import { ContainerWidget } from "widgets/ContainerWidget/widget";
import type { ContainerComponentProps } from "widgets/ContainerWidget/component";
import {
  FlexLayerAlignment,
  FlexVerticalAlignment,
  Positioning,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import type { ExtraDef } from "utils/autocomplete/defCreatorUtils";
import { generateTypeDef } from "utils/autocomplete/defCreatorUtils";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
} from "WidgetProvider/constants";
import type { SetterConfig } from "entities/AppTheming";
import { ButtonVariantTypes, RecaptchaTypes } from "components/constants";
import { Colors } from "constants/Colors";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { GridDefaults, WIDGET_TAGS } from "constants/WidgetConstants";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { getWidgetBluePrintUpdates } from "utils/WidgetBlueprintUtils";
import { DynamicHeight } from "utils/WidgetFeatures";
import { BlueprintOperationTypes } from "WidgetProvider/constants";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import type { FlexLayer } from "layoutSystems/autolayout/utils/types";
import type { LayoutProps } from "layoutSystems/anvil/utils/anvilTypes";
import { formPreset } from "layoutSystems/anvil/layoutComponents/presets/FormPreset";
import { LayoutSystemTypes } from "layoutSystems/types";

class FormWidget extends ContainerWidget {
  static type = "FORM_WIDGET";

  static getConfig() {
    return {
      name: "Form",
      iconSVG: IconSVG,
      thumbnailSVG: ThumbnailSVG,
      tags: [WIDGET_TAGS.LAYOUT],
      needsMeta: true,
      isCanvas: true,
      searchTags: ["group"],
    };
  }

  static getFeatures() {
    return {
      dynamicHeight: {
        sectionIndex: 0,
        active: true,
      },
    };
  }

  static getMethods() {
    return {
      getCanvasHeightOffset: (props: WidgetProps): number => {
        const offset =
          props.borderWidth && props.borderWidth > 1
            ? Math.round(
                (2 * parseInt(props.borderWidth, 10) || 0) /
                  GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
              )
            : 0;

        return offset;
      },
    };
  }

  static getDefaults() {
    return {
      rows: 40,
      columns: 24,
      borderColor: Colors.GREY_5,
      borderWidth: "1",
      animateLoading: true,
      widgetName: "Form",
      backgroundColor: Colors.WHITE,
      children: [],
      positioning: Positioning.Fixed,
      blueprint: {
        view: [
          {
            type: "CANVAS_WIDGET",
            position: { top: 0, left: 0 },
            props: {
              containerStyle: "none",
              canExtend: false,
              detachFromLayout: true,
              children: [],
              version: 1,
              blueprint: {
                view: [
                  {
                    type: "TEXT_WIDGET",
                    size: {
                      rows: 4,
                      cols: 24,
                    },
                    position: { top: 1, left: 1.5 },
                    props: {
                      text: "Form",
                      fontSize: "1.25rem",
                      version: 1,
                    },
                  },
                  {
                    type: "BUTTON_WIDGET",
                    size: {
                      rows: 4,
                      cols: 16,
                    },
                    position: {
                      top: 33,
                      left: 46,
                    },
                    props: {
                      text: "Submit",
                      buttonVariant: ButtonVariantTypes.PRIMARY,
                      disabledWhenInvalid: true,
                      resetFormOnClick: true,
                      recaptchaType: RecaptchaTypes.V3,
                      version: 1,
                    },
                  },
                  {
                    type: "BUTTON_WIDGET",
                    size: {
                      rows: 4,
                      cols: 16,
                    },
                    position: {
                      top: 33,
                      left: 30,
                    },
                    props: {
                      text: "Reset",
                      buttonVariant: ButtonVariantTypes.SECONDARY,
                      disabledWhenInvalid: false,
                      resetFormOnClick: true,
                      recaptchaType: RecaptchaTypes.V3,
                      version: 1,
                    },
                  },
                ],
              },
            },
          },
        ],
        operations: [
          {
            type: BlueprintOperationTypes.UPDATE_CREATE_PARAMS_BEFORE_ADD,
            fn: (
              widgets: { [widgetId: string]: FlattenedWidgetProps },
              widgetId: string,
              parentId: string,
              layoutSystemType: LayoutSystemTypes,
            ) => {
              if (layoutSystemType === LayoutSystemTypes.FIXED) return {};

              return { rows: 10 };
            },
          },
          {
            type: BlueprintOperationTypes.MODIFY_PROPS,
            fn: (
              widget: FlattenedWidgetProps,
              widgets: CanvasWidgetsReduxState,
              parent: FlattenedWidgetProps,
              layoutSystemType: LayoutSystemTypes,
            ) => {
              if (layoutSystemType === LayoutSystemTypes.FIXED) {
                return [];
              }

              //get Canvas Widget
              const canvasWidget: FlattenedWidgetProps = get(
                widget,
                "children.0",
              );

              //get Children Ids of the StatBox
              const childrenIds: string[] = get(widget, "children.0.children");

              //get Children props of the StatBox
              const children: FlattenedWidgetProps[] = childrenIds.map(
                (childId) => widgets[childId],
              );

              //get the Text Widgets
              const textWidget = children.filter(
                (child) => child.type === "TEXT_WIDGET",
              )?.[0];

              const [buttonWidget1, buttonWidget2] = children.filter(
                (child) => child.type === "BUTTON_WIDGET",
              );

              //Create flex layer object based on the children
              const flexLayers: FlexLayer[] = [
                {
                  children: [
                    {
                      id: textWidget.widgetId,
                      align: FlexLayerAlignment.Start,
                    },
                  ],
                },
                {
                  children: [
                    {
                      id: buttonWidget2.widgetId,
                      align: FlexLayerAlignment.End,
                    },
                    {
                      id: buttonWidget1.widgetId,
                      align: FlexLayerAlignment.End,
                    },
                  ],
                },
              ];

              const layout: LayoutProps[] = formPreset(
                textWidget.widgetId,
                buttonWidget1.widgetId,
                buttonWidget2.widgetId,
              );

              //create properties to be updated
              return getWidgetBluePrintUpdates({
                [widget.widgetId]: {
                  dynamicHeight: DynamicHeight.AUTO_HEIGHT,
                  bottomRow: widget.topRow + 10,
                  mobileBottomRow: (widget.mobileTopRow || widget.topRow) + 10,
                },
                [canvasWidget.widgetId]: {
                  flexLayers,
                  useAutoLayout: true,
                  positioning: Positioning.Vertical,
                  bottomRow: 100,
                  mobileBottomRow: 100,
                  layout,
                },
                [textWidget.widgetId]: {
                  responsiveBehavior: ResponsiveBehavior.Fill,
                  alignment: FlexLayerAlignment.Start,
                  topRow: 0,
                  bottomRow: 4,
                  leftColumn: 0,
                  rightColumn: GridDefaults.DEFAULT_GRID_COLUMNS,
                },
                [buttonWidget2.widgetId]: {
                  responsiveBehavior: ResponsiveBehavior.Hug,
                  alignment: FlexLayerAlignment.End,
                  topRow: 4,
                  bottomRow: 8,
                  leftColumn: GridDefaults.DEFAULT_GRID_COLUMNS - 2 * 16,
                  rightColumn: GridDefaults.DEFAULT_GRID_COLUMNS - 16,
                },
                [buttonWidget1.widgetId]: {
                  responsiveBehavior: ResponsiveBehavior.Hug,
                  alignment: FlexLayerAlignment.End,
                  topRow: 4,
                  bottomRow: 8,
                  leftColumn: GridDefaults.DEFAULT_GRID_COLUMNS - 16,
                  rightColumn: GridDefaults.DEFAULT_GRID_COLUMNS,
                },
              });
            },
          },
        ],
      },
      responsiveBehavior: ResponsiveBehavior.Fill,
      minWidth: FILL_WIDGET_MIN_WIDTH,
      flexVerticalAlignment: FlexVerticalAlignment.Stretch,
    };
  }

  static getAutoLayoutConfig() {
    return {
      widgetSize: [
        {
          viewportMinWidth: 0,
          configuration: () => {
            return {
              minWidth: "280px",
              minHeight: "100px",
            };
          },
        },
      ],
      disableResizeHandles: {
        vertical: true,
      },
    };
  }

  static getAnvilConfig(): AnvilConfig | null {
    return {
      isLargeWidget: false,
      widgetSize: {
        maxHeight: {},
        maxWidth: {},
        minHeight: { base: "100px" },
        minWidth: { base: "280px" },
      },
    };
  }

  checkInvalidChildren = (children: WidgetProps[]): boolean => {
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

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    return { ...childWidgets[0] };
  };

  updateFormData() {
    const firstChild = this.getChildContainer();

    if (firstChild) {
      const formData = this.getFormData(firstChild);

      if (!equal(formData, this.props.data)) {
        this.props.updateWidgetMetaProperty("data", formData);
      }
    }
  }

  getFormData(formWidget: ContainerWidgetProps<WidgetProps>) {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formData: any = {};

    if (formWidget.children)
      formWidget.children.forEach((widgetData) => {
        if (!_.isNil(widgetData.value)) {
          formData[widgetData.widgetName] = widgetData.value;
        }
      });

    return formData;
  }

  renderChildWidget(): React.ReactNode {
    const childContainer = this.getChildContainer();

    const { componentHeight, componentWidth } = this.props;

    if (childContainer.children) {
      const isInvalid = this.checkInvalidChildren(childContainer.children);

      childContainer.children = childContainer.children.map(
        (child: WidgetProps) => {
          const grandChild = { ...child };

          if (isInvalid) grandChild.isFormValid = false;

          // Add submit and reset handlers
          grandChild.onReset = this.handleResetInputs;

          return grandChild;
        },
      );
    }

    childContainer.rightColumn = componentWidth;
    childContainer.bottomRow = componentHeight;

    return super.renderChildWidget(childContainer);
  }

  static getStylsheetConfig() {
    return {
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
    };
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return {
      hasChanges: false,
    };
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return (widget: FormWidgetProps, extraDefsToDefine?: ExtraDef) => ({
      "!doc":
        "Form is used to capture a set of data inputs from a user. Forms are used specifically because they reset the data inputs when a form is submitted and disable submission for invalid data inputs",
      "!url": "https://docs.appsmith.com/widget-reference/form",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      data: generateTypeDef(widget.data, extraDefsToDefine),
      hasChanges: "bool",
    });
  }

  static getSetterConfig(): SetterConfig {
    return {
      __setters: {
        setVisibility: {
          path: "isVisible",
          type: "string",
        },
      },
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return { positioning: Positioning.Fixed };
  }
}

export interface FormWidgetProps extends ContainerComponentProps {
  name: string;
  data: Record<string, unknown>;
  hasChanges: boolean;
}

export default FormWidget;
