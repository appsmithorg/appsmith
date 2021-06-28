import { WidgetConfigReducerState } from "reducers/entityReducers/widgetConfigReducer";
import { WidgetProps } from "widgets/BaseWidget";
import moment from "moment-timezone";
import { cloneDeep, get, indexOf, isString } from "lodash";
import { generateReactKey } from "utils/generators";
import { WidgetTypes } from "constants/WidgetConstants";
import { BlueprintOperationTypes } from "sagas/WidgetBlueprintSagasEnums";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import { Colors } from "constants/Colors";
import FileDataTypes from "widgets/FileDataTypes";
/*
 ********************************{Grid Density Migration}*********************************
 */
export const GRID_DENSITY_MIGRATION_V1 = 4;

/**
 * this config sets the default values of properties being used in the widget
 */
const WidgetConfigResponse: WidgetConfigReducerState = {
  config: {
    BUTTON_WIDGET: {
      text: "Submit",
      buttonStyle: "PRIMARY_BUTTON",
      rows: 1 * GRID_DENSITY_MIGRATION_V1,
      columns: 2 * GRID_DENSITY_MIGRATION_V1,
      widgetName: "Button",
      isDisabled: false,
      isVisible: true,
      isDefaultClickDisabled: true,
      version: 1,
    },
    TEXT_WIDGET: {
      text: "Label",
      fontSize: "PARAGRAPH",
      fontStyle: "BOLD",
      textAlign: "LEFT",
      textColor: Colors.THUNDER,
      rows: 1 * GRID_DENSITY_MIGRATION_V1,
      columns: 4 * GRID_DENSITY_MIGRATION_V1,
      widgetName: "Text",
      version: 1,
    },
    RICH_TEXT_EDITOR_WIDGET: {
      defaultText: "This is the initial <b>content</b> of the editor",
      rows: 5 * GRID_DENSITY_MIGRATION_V1,
      columns: 8 * GRID_DENSITY_MIGRATION_V1,
      isDisabled: false,
      isVisible: true,
      widgetName: "RichTextEditor",
      isDefaultClickDisabled: true,
      inputType: "html",
      version: 1,
    },
    IMAGE_WIDGET: {
      defaultImage:
        "https://res.cloudinary.com/drako999/image/upload/v1589196259/default.png",
      imageShape: "RECTANGLE",
      maxZoomLevel: 1,
      image: "",
      rows: 3 * GRID_DENSITY_MIGRATION_V1,
      columns: 4 * GRID_DENSITY_MIGRATION_V1,
      widgetName: "Image",
      version: 1,
    },
    INPUT_WIDGET: {
      inputType: "TEXT",
      rows: 1 * GRID_DENSITY_MIGRATION_V1,
      label: "",
      columns: 5 * GRID_DENSITY_MIGRATION_V1,
      widgetName: "Input",
      version: 1,
      resetOnSubmit: true,
      isRequired: false,
      isDisabled: false,
    },
    SWITCH_WIDGET: {
      label: "Label",
      rows: 1 * GRID_DENSITY_MIGRATION_V1,
      columns: 2 * GRID_DENSITY_MIGRATION_V1,
      defaultSwitchState: true,
      widgetName: "Switch",
      alignWidget: "LEFT",
      version: 1,
      isDisabled: false,
    },
    ICON_WIDGET: {
      widgetName: "Icon",
      rows: 1 * GRID_DENSITY_MIGRATION_V1,
      columns: 1 * GRID_DENSITY_MIGRATION_V1,
      version: 1,
    },
    CONTAINER_WIDGET: {
      backgroundColor: "#FFFFFF",
      rows: 10 * GRID_DENSITY_MIGRATION_V1,
      columns: 8 * GRID_DENSITY_MIGRATION_V1,
      widgetName: "Container",
      containerStyle: "card",
      children: [],
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
            },
          },
        ],
      },
      version: 1,
    },
    DATE_PICKER_WIDGET: {
      isDisabled: false,
      datePickerType: "DATE_PICKER",
      rows: 1 * GRID_DENSITY_MIGRATION_V1,
      label: "",
      dateFormat: "YYYY-MM-DD HH:mm",
      columns: 5 * GRID_DENSITY_MIGRATION_V1,
      widgetName: "DatePicker",
      defaultDate: moment().format("YYYY-MM-DD HH:mm"),
      version: 1,
    },
    DATE_PICKER_WIDGET2: {
      isDisabled: false,
      datePickerType: "DATE_PICKER",
      rows: 1 * GRID_DENSITY_MIGRATION_V1,
      label: "",
      dateFormat: "YYYY-MM-DD HH:mm",
      columns: 5 * GRID_DENSITY_MIGRATION_V1,
      widgetName: "DatePicker",
      defaultDate: moment().toISOString(),
      minDate: "2001-01-01 00:00",
      maxDate: "2041-12-31 23:59",
      version: 2,
      isRequired: false,
      closeOnSelection: false,
      shortcuts: false,
    },
    VIDEO_WIDGET: {
      rows: 7 * GRID_DENSITY_MIGRATION_V1,
      columns: 7 * GRID_DENSITY_MIGRATION_V1,
      widgetName: "Video",
      url: "https://www.youtube.com/watch?v=mzqK0QIZRLs",
      autoPlay: false,
      version: 1,
    },
    TABLE_WIDGET: {
      rows: 7 * GRID_DENSITY_MIGRATION_V1,
      columns: 9 * GRID_DENSITY_MIGRATION_V1,
      label: "Data",
      widgetName: "Table",
      searchKey: "",
      textSize: "PARAGRAPH",
      horizontalAlignment: "LEFT",
      verticalAlignment: "CENTER",
      dynamicBindingPathList: [
        {
          key: "primaryColumns.step.computedValue",
        },
        {
          key: "primaryColumns.task.computedValue",
        },
        {
          key: "primaryColumns.status.computedValue",
        },
        {
          key: "primaryColumns.action.computedValue",
        },
      ],
      primaryColumns: {
        step: {
          index: 0,
          width: 150,
          id: "step",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textSize: "PARAGRAPH",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "step",
          computedValue:
            "{{Table1.sanitizedTableData.map((currentRow) => { return currentRow.step})}}",
        },
        task: {
          index: 1,
          width: 150,
          id: "task",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textSize: "PARAGRAPH",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "task",
          computedValue:
            "{{Table1.sanitizedTableData.map((currentRow) => { return currentRow.task})}}",
        },
        status: {
          index: 2,
          width: 150,
          id: "status",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textSize: "PARAGRAPH",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "status",
          computedValue:
            "{{Table1.sanitizedTableData.map((currentRow) => { return currentRow.status})}}",
        },
        action: {
          index: 3,
          width: 150,
          id: "action",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "button",
          textSize: "PARAGRAPH",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "action",
          onClick:
            "{{currentRow.step === '#1' ? showAlert('Done', 'success') : currentRow.step === '#2' ? navigateTo('https://docs.appsmith.com/core-concepts/connecting-to-data-sources/connecting-to-databases/querying-a-database',undefined,'NEW_WINDOW') : navigateTo('https://docs.appsmith.com/core-concepts/displaying-data-read/display-data-tables',undefined,'NEW_WINDOW')}}",
          computedValue:
            "{{Table1.sanitizedTableData.map((currentRow) => { return currentRow.action})}}",
        },
      },
      derivedColumns: {},
      tableData: [
        {
          step: "#1",
          task: "Drop a table",
          status: "✅",
          action: "",
        },
        {
          step: "#2",
          task: "Create a query fetch_users with the Mock DB",
          status: "--",
          action: "",
        },
        {
          step: "#3",
          task: "Bind the query using {{fetch_users.data}}",
          status: "--",
          action: "",
        },
      ],
      columnSizeMap: {
        task: 245,
        step: 62,
        status: 75,
      },
      isVisibleSearch: true,
      isVisibleFilters: true,
      isVisibleDownload: true,
      isVisibleCompactMode: true,
      isVisiblePagination: true,
      version: 1,
    },
    DROP_DOWN_WIDGET: {
      rows: 1 * GRID_DENSITY_MIGRATION_V1,
      columns: 5 * GRID_DENSITY_MIGRATION_V1,
      label: "",
      selectionType: "SINGLE_SELECT",
      options: [
        { label: "Blue", value: "BLUE" },
        { label: "Green", value: "GREEN" },
        { label: "Red", value: "RED" },
      ],
      widgetName: "Select",
      defaultOptionValue: "GREEN",
      version: 1,
      isRequired: false,
      isDisabled: false,
    },
    CHECKBOX_WIDGET: {
      rows: 1 * GRID_DENSITY_MIGRATION_V1,
      columns: 3 * GRID_DENSITY_MIGRATION_V1,
      label: "Label",
      defaultCheckedState: true,
      widgetName: "Checkbox",
      version: 1,
      alignWidget: "LEFT",
      isDisabled: false,
      isRequired: false,
    },
    RADIO_GROUP_WIDGET: {
      rows: 2 * GRID_DENSITY_MIGRATION_V1,
      columns: 3 * GRID_DENSITY_MIGRATION_V1,
      label: "",
      options: [
        { label: "Yes", value: "Y" },
        { label: "No", value: "N" },
      ],
      defaultOptionValue: "Y",
      widgetName: "RadioGroup",
      version: 1,
      isRequired: false,
      isDisabled: false,
    },
    FILE_PICKER_WIDGET: {
      rows: 1 * GRID_DENSITY_MIGRATION_V1,
      files: [],
      selectedFiles: [],
      defaultSelectedFiles: [],
      allowedFileTypes: [],
      label: "Select Files",
      columns: 4 * GRID_DENSITY_MIGRATION_V1,
      maxNumFiles: 1,
      maxFileSize: 5,
      fileDataType: FileDataTypes.Base64,
      widgetName: "FilePicker",
      isDefaultClickDisabled: true,
      version: 1,
      isRequired: false,
      isDisabled: false,
    },
    TABS_WIDGET: {
      rows: 7 * GRID_DENSITY_MIGRATION_V1,
      columns: 8 * GRID_DENSITY_MIGRATION_V1,
      shouldScrollContents: false,
      widgetName: "Tabs",
      tabsObj: {
        tab1: {
          label: "Tab 1",
          id: "tab1",
          widgetId: "",
          isVisible: true,
          index: 0,
        },
        tab2: {
          label: "Tab 2",
          id: "tab2",
          widgetId: "",
          isVisible: true,
          index: 1,
        },
      },
      shouldShowTabs: true,
      defaultTab: "Tab 1",
      blueprint: {
        operations: [
          {
            type: BlueprintOperationTypes.MODIFY_PROPS,
            fn: (widget: WidgetProps & { children?: WidgetProps[] }) => {
              const tabs = Object.values({ ...widget.tabsObj });
              const tabsObj = tabs.reduce((obj: any, tab: any) => {
                const newTab = { ...tab };
                newTab.widgetId = generateReactKey();
                obj[newTab.id] = newTab;
                return obj;
              }, {});
              const updatePropertyMap = [
                {
                  widgetId: widget.widgetId,
                  propertyName: "tabsObj",
                  propertyValue: tabsObj,
                },
              ];
              return updatePropertyMap;
            },
          },
        ],
      },
      version: 3,
    },
    MODAL_WIDGET: {
      rows: 6 * GRID_DENSITY_MIGRATION_V1,
      columns: 6 * GRID_DENSITY_MIGRATION_V1,
      size: "MODAL_SMALL",
      canEscapeKeyClose: true,
      // detachFromLayout is set true for widgets that are not bound to the widgets within the layout.
      // setting it to true will only render the widgets(from sidebar) on the main container without any collision check.
      detachFromLayout: true,
      canOutsideClickClose: true,
      shouldScrollContents: true,
      widgetName: "Modal",
      children: [],
      version: 1,
      blueprint: {
        view: [
          {
            type: "CANVAS_WIDGET",
            position: { left: 0, top: 0 },
            props: {
              detachFromLayout: true,
              canExtend: true,
              isVisible: true,
              isDisabled: false,
              shouldScrollContents: false,
              children: [],
              version: 1,
              blueprint: {
                view: [
                  {
                    type: "ICON_WIDGET",
                    position: { left: 14 * GRID_DENSITY_MIGRATION_V1, top: 1 },
                    size: {
                      rows: 1 * GRID_DENSITY_MIGRATION_V1,
                      cols: 2 * GRID_DENSITY_MIGRATION_V1,
                    },
                    props: {
                      iconName: "cross",
                      iconSize: 24,
                      color: "#040627",
                      version: 1,
                    },
                  },
                  {
                    type: "TEXT_WIDGET",
                    position: { left: 1, top: 1 },
                    size: {
                      rows: 1 * GRID_DENSITY_MIGRATION_V1,
                      cols: 10 * GRID_DENSITY_MIGRATION_V1,
                    },
                    props: {
                      text: "Modal Title",
                      fontSize: "HEADING1",
                      version: 1,
                    },
                  },
                  {
                    type: "BUTTON_WIDGET",
                    position: {
                      left: 9 * GRID_DENSITY_MIGRATION_V1,
                      top: 4 * GRID_DENSITY_MIGRATION_V1,
                    },
                    size: {
                      rows: 1 * GRID_DENSITY_MIGRATION_V1,
                      cols: 3 * GRID_DENSITY_MIGRATION_V1,
                    },
                    props: {
                      text: "Cancel",
                      buttonStyle: "SECONDARY_BUTTON",
                      version: 1,
                    },
                  },
                  {
                    type: "BUTTON_WIDGET",
                    position: {
                      left: 12 * GRID_DENSITY_MIGRATION_V1,
                      top: 4 * GRID_DENSITY_MIGRATION_V1,
                    },
                    size: {
                      rows: 1 * GRID_DENSITY_MIGRATION_V1,
                      cols: 4 * GRID_DENSITY_MIGRATION_V1,
                    },
                    props: {
                      text: "Confirm",
                      buttonStyle: "PRIMARY_BUTTON",
                      version: 1,
                    },
                  },
                ],
                operations: [
                  {
                    type: BlueprintOperationTypes.MODIFY_PROPS,
                    fn: (
                      widget: WidgetProps & { children?: WidgetProps[] },
                      widgets: { [widgetId: string]: FlattenedWidgetProps },
                      parent?: WidgetProps & { children?: WidgetProps[] },
                    ) => {
                      const iconChild =
                        widget.children &&
                        widget.children.find(
                          (child) => child.type === "ICON_WIDGET",
                        );

                      if (iconChild && parent) {
                        return [
                          {
                            widgetId: iconChild.widgetId,
                            propertyName: "onClick",
                            propertyValue: `{{closeModal('${parent.widgetName}')}}`,
                          },
                        ];
                      }
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
    CANVAS_WIDGET: {
      rows: 0,
      columns: 0,
      widgetName: "Canvas",
      version: 1,
    },
    CHART_WIDGET: {
      rows: 8 * GRID_DENSITY_MIGRATION_V1,
      columns: 6 * GRID_DENSITY_MIGRATION_V1,
      widgetName: "Chart",
      chartType: "LINE_CHART",
      chartName: "Last week's revenue",
      allowHorizontalScroll: false,
      version: 1,
      chartData: {
        [generateReactKey()]: {
          seriesName: "Sales",
          data: [
            {
              x: "Mon",
              y: 10000,
            },
            {
              x: "Tue",
              y: 12000,
            },
            {
              x: "Wed",
              y: 32000,
            },
            {
              x: "Thu",
              y: 28000,
            },
            {
              x: "Fri",
              y: 14000,
            },
            {
              x: "Sat",
              y: 19000,
            },
            {
              x: "Sun",
              y: 36000,
            },
          ],
        },
      },
      xAxisName: "Last Week",
      yAxisName: "Total Order Revenue $",
      customFusionChartConfig: {
        type: "column2d",
        dataSource: {
          chart: {
            caption: "Last week's revenue",
            xAxisName: "Last Week",
            yAxisName: "Total Order Revenue $",
            theme: "fusion",
          },
          data: [
            {
              label: "Mon",
              value: 10000,
            },
            {
              label: "Tue",
              value: 12000,
            },
            {
              label: "Wed",
              value: 32000,
            },
            {
              label: "Thu",
              value: 28000,
            },
            {
              label: "Fri",
              value: 14000,
            },
            {
              label: "Sat",
              value: 19000,
            },
            {
              label: "Sun",
              value: 36000,
            },
          ],
          trendlines: [
            {
              line: [
                {
                  startvalue: "38000",
                  valueOnRight: "1",
                  displayvalue: "Weekly Target",
                },
              ],
            },
          ],
        },
      },
    },
    FORM_BUTTON_WIDGET: {
      rows: 1 * GRID_DENSITY_MIGRATION_V1,
      columns: 3 * GRID_DENSITY_MIGRATION_V1,
      widgetName: "FormButton",
      text: "Submit",
      isDefaultClickDisabled: true,
      version: 1,
    },
    FORM_WIDGET: {
      rows: 13 * GRID_DENSITY_MIGRATION_V1,
      columns: 7 * GRID_DENSITY_MIGRATION_V1,
      widgetName: "Form",
      backgroundColor: "white",
      children: [],
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
                      rows: 1 * GRID_DENSITY_MIGRATION_V1,
                      cols: 6 * GRID_DENSITY_MIGRATION_V1,
                    },
                    position: { top: 1, left: 1.5 },
                    props: {
                      text: "Form",
                      fontSize: "HEADING1",
                      version: 1,
                    },
                  },
                  {
                    type: "FORM_BUTTON_WIDGET",
                    size: {
                      rows: 1 * GRID_DENSITY_MIGRATION_V1,
                      cols: 4 * GRID_DENSITY_MIGRATION_V1,
                    },
                    position: {
                      top: 11.25 * GRID_DENSITY_MIGRATION_V1,
                      left: 11.6 * GRID_DENSITY_MIGRATION_V1,
                    },
                    props: {
                      text: "Submit",
                      buttonStyle: "PRIMARY_BUTTON",
                      disabledWhenInvalid: true,
                      resetFormOnClick: true,
                      version: 1,
                    },
                  },
                  {
                    type: "FORM_BUTTON_WIDGET",
                    size: {
                      rows: 1 * GRID_DENSITY_MIGRATION_V1,
                      cols: 4 * GRID_DENSITY_MIGRATION_V1,
                    },
                    position: {
                      top: 11.25 * GRID_DENSITY_MIGRATION_V1,
                      left: 7.5 * GRID_DENSITY_MIGRATION_V1,
                    },
                    props: {
                      text: "Reset",
                      buttonStyle: "SECONDARY_BUTTON",
                      disabledWhenInvalid: false,
                      resetFormOnClick: true,
                      version: 1,
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
    MAP_WIDGET: {
      rows: 12 * GRID_DENSITY_MIGRATION_V1,
      columns: 8 * GRID_DENSITY_MIGRATION_V1,
      isDisabled: false,
      isVisible: true,
      widgetName: "Map",
      enableSearch: true,
      zoomLevel: 50,
      enablePickLocation: true,
      allowZoom: true,
      mapCenter: { lat: 25.122, long: 50.132 },
      defaultMarkers: [{ lat: 25.122, long: 50.132, title: "Test A" }],
      version: 1,
    },
    SKELETON_WIDGET: {
      isLoading: true,
      rows: 1 * GRID_DENSITY_MIGRATION_V1,
      columns: 1 * GRID_DENSITY_MIGRATION_V1,
      widgetName: "Skeleton",
      version: 1,
    },
    TABS_MIGRATOR_WIDGET: {
      isLoading: true,
      rows: 1,
      columns: 1,
      widgetName: "Skeleton",
      version: 1,
    },
    [WidgetTypes.LIST_WIDGET]: {
      backgroundColor: "",
      itemBackgroundColor: "#FFFFFF",
      rows: 10 * GRID_DENSITY_MIGRATION_V1,
      columns: 8 * GRID_DENSITY_MIGRATION_V1,
      gridType: "vertical",
      template: {},
      enhancements: {
        child: {
          autocomplete: (parentProps: any) => {
            return parentProps.childAutoComplete;
          },
          updateDataTreePath: (parentProps: any, dataTreePath: string) => {
            return `${parentProps.widgetName}.template.${dataTreePath}`;
          },
          propertyUpdateHook: (
            parentProps: any,
            widgetName: string,
            propertyPath: string,
            propertyValue: string,
            isTriggerProperty: boolean,
          ) => {
            let value = propertyValue;

            if (!parentProps.widgetId) return [];

            const { jsSnippets } = getDynamicBindings(propertyValue);

            const modifiedAction = jsSnippets.reduce(
              (prev: string, next: string) => {
                return `${prev}${next}`;
              },
              "",
            );

            value = `{{${parentProps.widgetName}.listData.map((currentItem) => {
              return (function(){
                return  ${modifiedAction};
              })();
            })}}`;

            if (!modifiedAction) {
              value = propertyValue;
            }

            const path = `template.${widgetName}.${propertyPath}`;

            return [
              {
                widgetId: parentProps.widgetId,
                propertyPath: path,
                propertyValue: isTriggerProperty ? propertyValue : value,
                isDynamicTrigger: isTriggerProperty,
              },
            ];
          },
        },
      },
      gridGap: 0,
      listData: [
        {
          id: 1,
          num: "001",
          name: "Bulbasaur",
          img: "http://www.serebii.net/pokemongo/pokemon/001.png",
        },
        {
          id: 2,
          num: "002",
          name: "Ivysaur",
          img: "http://www.serebii.net/pokemongo/pokemon/002.png",
        },
        {
          id: 3,
          num: "003",
          name: "Venusaur",
          img: "http://www.serebii.net/pokemongo/pokemon/003.png",
        },
        {
          id: 4,
          num: "004",
          name: "Charmander",
          img: "http://www.serebii.net/pokemongo/pokemon/004.png",
        },
        {
          id: 5,
          num: "005",
          name: "Charmeleon",
          img: "http://www.serebii.net/pokemongo/pokemon/005.png",
        },
        {
          id: 6,
          num: "006",
          name: "Charizard",
          img: "http://www.serebii.net/pokemongo/pokemon/006.png",
        },
      ],
      widgetName: "List",
      children: [],
      blueprint: {
        view: [
          {
            type: "CANVAS_WIDGET",
            position: { top: 0, left: 0 },
            props: {
              containerStyle: "none",
              canExtend: false,
              detachFromLayout: true,
              dropDisabled: true,
              openParentPropertyPane: true,
              noPad: true,
              children: [],
              blueprint: {
                view: [
                  {
                    type: "CONTAINER_WIDGET",
                    size: {
                      rows: 4 * GRID_DENSITY_MIGRATION_V1,
                      cols: 16 * GRID_DENSITY_MIGRATION_V1,
                    },
                    position: { top: 0, left: 0 },
                    props: {
                      backgroundColor: "white",
                      containerStyle: "card",
                      dragDisabled: true,
                      isDeletable: false,
                      disallowCopy: true,
                      disablePropertyPane: true,
                      openParentPropertyPane: true,
                      children: [],
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
                                    type: "IMAGE_WIDGET",
                                    size: {
                                      rows: 3 * GRID_DENSITY_MIGRATION_V1,
                                      cols: 4 * GRID_DENSITY_MIGRATION_V1,
                                    },
                                    position: { top: 0, left: 0 },
                                    props: {
                                      defaultImage:
                                        "https://res.cloudinary.com/drako999/image/upload/v1589196259/default.png",
                                      imageShape: "RECTANGLE",
                                      maxZoomLevel: 1,
                                      image: "{{currentItem.img}}",
                                      dynamicBindingPathList: [
                                        {
                                          key: "image",
                                        },
                                      ],
                                      dynamicTriggerPathList: [],
                                    },
                                  },
                                  {
                                    type: "TEXT_WIDGET",
                                    size: {
                                      rows: 1 * GRID_DENSITY_MIGRATION_V1,
                                      cols: 6 * GRID_DENSITY_MIGRATION_V1,
                                    },
                                    position: {
                                      top: 0,
                                      left: 4 * GRID_DENSITY_MIGRATION_V1,
                                    },
                                    props: {
                                      text: "{{currentItem.name}}",
                                      textStyle: "HEADING",
                                      textAlign: "LEFT",
                                      dynamicBindingPathList: [
                                        {
                                          key: "text",
                                        },
                                      ],
                                      dynamicTriggerPathList: [],
                                    },
                                  },
                                  {
                                    type: "TEXT_WIDGET",
                                    size: {
                                      rows: 1 * GRID_DENSITY_MIGRATION_V1,
                                      cols: 6 * GRID_DENSITY_MIGRATION_V1,
                                    },
                                    position: {
                                      top: 1 * GRID_DENSITY_MIGRATION_V1,
                                      left: 4 * GRID_DENSITY_MIGRATION_V1,
                                    },
                                    props: {
                                      text: "{{currentItem.num}}",
                                      textStyle: "BODY",
                                      textAlign: "LEFT",
                                      dynamicBindingPathList: [
                                        {
                                          key: "text",
                                        },
                                      ],
                                      dynamicTriggerPathList: [],
                                    },
                                  },
                                ],
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
        operations: [
          {
            type: BlueprintOperationTypes.MODIFY_PROPS,
            fn: (
              widget: WidgetProps & { children?: WidgetProps[] },
              widgets: { [widgetId: string]: FlattenedWidgetProps },
            ) => {
              let template = {};
              const logBlackListMap: any = {};
              const container = get(
                widgets,
                `${get(widget, "children.0.children.0")}`,
              );
              const canvas = get(widgets, `${get(container, "children.0")}`);
              let updatePropertyMap: any = [];
              const dynamicBindingPathList: any[] = get(
                widget,
                "dynamicBindingPathList",
                [],
              );

              canvas.children &&
                get(canvas, "children", []).forEach((child: string) => {
                  const childWidget = cloneDeep(get(widgets, `${child}`));
                  const logBlackList: { [key: string]: boolean } = {};
                  const keys = Object.keys(childWidget);

                  for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    let value = childWidget[key];

                    if (isString(value) && value.indexOf("currentItem") > -1) {
                      const { jsSnippets } = getDynamicBindings(value);

                      const modifiedAction = jsSnippets.reduce(
                        (prev: string, next: string) => {
                          return prev + `${next}`;
                        },
                        "",
                      );

                      value = `{{${widget.widgetName}.listData.map((currentItem) => ${modifiedAction})}}`;

                      childWidget[key] = value;

                      dynamicBindingPathList.push({
                        key: `template.${childWidget.widgetName}.${key}`,
                      });
                    }
                  }

                  Object.keys(childWidget).map((key) => {
                    logBlackList[key] = true;
                  });

                  logBlackListMap[childWidget.widgetId] = logBlackList;

                  template = {
                    ...template,
                    [childWidget.widgetName]: childWidget,
                  };
                });

              updatePropertyMap = [
                {
                  widgetId: widget.widgetId,
                  propertyName: "dynamicBindingPathList",
                  propertyValue: dynamicBindingPathList,
                },
                {
                  widgetId: widget.widgetId,
                  propertyName: "template",
                  propertyValue: template,
                },
              ];

              // add logBlackList to updateProperyMap for all children
              updatePropertyMap = updatePropertyMap.concat(
                Object.keys(logBlackListMap).map((logBlackListMapKey) => {
                  return {
                    widgetId: logBlackListMapKey,
                    propertyName: "logBlackList",
                    propertyValue: logBlackListMap[logBlackListMapKey],
                  };
                }),
              );

              return updatePropertyMap;
            },
          },
          {
            type: BlueprintOperationTypes.CHILD_OPERATIONS,
            fn: (
              widgets: { [widgetId: string]: FlattenedWidgetProps },
              widgetId: string,
              parentId: string,
            ) => {
              if (!parentId) return { widgets };
              const widget = { ...widgets[widgetId] };
              const parent = { ...widgets[parentId] };
              const logBlackList: { [key: string]: boolean } = {};

              const disallowedWidgets = [
                WidgetTypes.TABLE_WIDGET,
                WidgetTypes.LIST_WIDGET,
                WidgetTypes.TABS_WIDGET,
                WidgetTypes.FORM_WIDGET,
                WidgetTypes.CONTAINER_WIDGET,
              ];

              if (indexOf(disallowedWidgets, widget.type) > -1) {
                const widget = widgets[widgetId];
                if (widget.children && widget.children.length > 0) {
                  widget.children.forEach((childId: string) => {
                    delete widgets[childId];
                  });
                }
                if (widget.parentId) {
                  const _parent = { ...widgets[widget.parentId] };
                  _parent.children = _parent.children?.filter(
                    (id) => id !== widgetId,
                  );
                  widgets[widget.parentId] = _parent;
                }
                delete widgets[widgetId];

                return {
                  widgets,
                  message: `${
                    WidgetConfigResponse.config[widget.type].widgetName
                  } widgets cannot be used inside the list widget.`,
                };
              }

              const template = {
                ...get(parent, "template", {}),
                [widget.widgetName]: widget,
              };

              parent.template = template;

              // add logBlackList for the children being added
              Object.keys(widget).map((key) => {
                logBlackList[key] = true;
              });

              widget.logBlackList = logBlackList;

              widgets[parentId] = parent;
              widgets[widgetId] = widget;

              return { widgets };
            },
          },
        ],
      },
    },
    [WidgetTypes.IFRAME_WIDGET]: {
      source: "https://www.wikipedia.org/",
      borderOpacity: 100,
      borderWidth: 1,
      rows: 8 * GRID_DENSITY_MIGRATION_V1,
      columns: 7 * GRID_DENSITY_MIGRATION_V1,
      widgetName: "Iframe",
      version: 1,
    },
  },
  configVersion: 1,
};

export default WidgetConfigResponse;
