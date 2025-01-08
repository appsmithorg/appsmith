import React from "react";
import BaseWidget from "widgets/BaseWidget";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { ValidationTypes } from "constants/WidgetValidation";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import KanbanComponent from "../component";

export interface KanbanBoardWidgetProps extends WidgetProps {
  columns: Array<{
    title: string;
    tasks: Array<{
      title: string;
      description: string;
      style?: Record<string, unknown>;
    }>;
    style?: Record<string, unknown>;
  }>;
  backgroundColor?: string;
  borderRadius?: string;
  boxShadow?: string;
  onTaskMove?: (columns: KanbanBoardWidgetProps["columns"]) => void;
  sanitizedColumns: KanbanBoardWidgetProps["columns"];
  isValid: boolean;
}

class KanbanBoardWidget extends BaseWidget<
  KanbanBoardWidgetProps,
  WidgetState
> {
  static type = "KANBAN_BOARD_WIDGET";

  static getConfig() {
    return {
      name: "Kanban Board",
      iconSVG: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="4" width="20" height="20" rx="2" stroke="currentColor" stroke-width="2"/>
  <line x1="10" y1="4" x2="10" y2="24" stroke="currentColor" stroke-width="2"/>
  <line x1="18" y1="4" x2="18" y2="24" stroke="currentColor" stroke-width="2"/>
</svg>`,
      needsMeta: true,
      isCanvas: false,
      defaults: {
        rows: 40,
        columnCount: 24,
        widgetName: "KanbanBoard",
        version: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: "0px",
        boxShadow: "none",
        columns: [
          {
            title: "To Do",
            tasks: [
              {
                title: "Task 1",
                description: "Description 1",
              },
            ],
          },
          {
            title: "In Progress",
            tasks: [],
          },
          {
            title: "Done",
            tasks: [],
          },
        ],
      },
    };
  }

  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "Data",
        children: [
          {
            propertyName: "columns",
            label: "Columns",
            controlType: "ARRAY_FIELD",
            placeholderText: '[{"title": "To Do", "tasks": []}]',
            isBindProperty: true,
            isTriggerProperty: false,
            panelConfig: {
              editableTitle: true,
              titlePropertyName: "title",
              panelIdPropertyName: "id",
              updateHook: () => [],
              children: [
                {
                  sectionName: "Column Settings",
                  children: [
                    {
                      propertyName: "title",
                      label: "Title",
                      controlType: "INPUT_TEXT",
                      placeholderText: "Enter column title",
                      isBindProperty: true,
                      isTriggerProperty: false,
                      validation: {
                        type: ValidationTypes.TEXT,
                        params: {
                          required: true,
                          default: "",
                        },
                      },
                    },
                    {
                      propertyName: "tasks",
                      label: "Tasks",
                      controlType: "ARRAY_FIELD",
                      isBindProperty: true,
                      isTriggerProperty: false,
                      panelConfig: {
                        editableTitle: true,
                        titlePropertyName: "title",
                        panelIdPropertyName: "id",
                        updateHook: () => [],
                        children: [
                          {
                            sectionName: "Task Settings",
                            children: [
                              {
                                propertyName: "title",
                                label: "Title",
                                controlType: "INPUT_TEXT",
                                placeholderText: "Enter task title",
                                isBindProperty: true,
                                isTriggerProperty: false,
                                validation: {
                                  type: ValidationTypes.TEXT,
                                  params: {
                                    required: true,
                                    default: "",
                                  },
                                },
                              },
                              {
                                propertyName: "description",
                                label: "Description",
                                controlType: "INPUT_TEXT",
                                placeholderText: "Enter task description",
                                isBindProperty: true,
                                isTriggerProperty: false,
                                validation: {
                                  type: ValidationTypes.TEXT,
                                  params: {
                                    required: true,
                                    default: "",
                                  },
                                },
                              },
                              {
                                propertyName: "backgroundColor",
                                label: "Background Color",
                                controlType: "COLOR_PICKER",
                                isBindProperty: false,
                                isTriggerProperty: false,
                              },
                              {
                                propertyName: "textColor",
                                label: "Text Color",
                                controlType: "COLOR_PICKER",
                                isBindProperty: false,
                                isTriggerProperty: false,
                              },
                            ],
                          },
                        ],
                      },
                    },
                    {
                      propertyName: "backgroundColor",
                      label: "Background Color",
                      controlType: "COLOR_PICKER",
                      isBindProperty: false,
                      isTriggerProperty: false,
                    },
                    {
                      propertyName: "textColor",
                      label: "Text Color",
                      controlType: "COLOR_PICKER",
                      isBindProperty: false,
                      isTriggerProperty: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        sectionName: "General",
        children: [
          {
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
          },
          {
            propertyName: "animateLoading",
            label: "Animate Loading",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
          },
        ],
      },
      {
        sectionName: "Styles",
        children: [
          {
            propertyName: "backgroundColor",
            label: "Background Color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "borderRadius",
            label: "Border Radius",
            controlType: "BORDER_RADIUS_OPTIONS",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "boxShadow",
            label: "Box Shadow",
            controlType: "BOX_SHADOW_OPTIONS",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
    ];
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      sanitizedColumns: `{{ this.columns?.map((column) => ({
        ...column,
        tasks: column.tasks || []
      })) || [] }}`,
      isValid: `{{ Array.isArray(this.columns) }}`,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  static getMetaPropertiesMap(): Record<string, unknown> {
    return {};
  }

  getPageView() {
    const {
      backgroundColor,
      borderRadius,
      boxShadow,
      isValid,
      sanitizedColumns,
    } = this.props;

    if (!isValid) {
      return null;
    }

    return (
      <KanbanComponent
        backgroundColor={backgroundColor}
        borderRadius={borderRadius}
        boxShadow={boxShadow}
        columns={sanitizedColumns}
        onTaskMove={React.useCallback(
          (updatedColumns: KanbanBoardWidgetProps["columns"]) => {
            this.props.updateWidgetMetaProperty(
              "columns",
              updatedColumns,
              true,
            );
          },
          [this.props.updateWidgetMetaProperty],
        )}
      />
    );
  }

  getWidgetView() {
    return this.getPageView();
  }
}

export default KanbanBoardWidget;
