import type {
  CanvasWidgetsReduxState,
  CrudWidgetsPayload,
} from "reducers/entityReducers/canvasWidgetsReducer";
import type {
  AnvilHighlightInfo,
  LayoutProps,
  WidgetLayoutProps,
} from "../../anvilTypes";
import { addWidgetsToChildTemplate, getAffectedLayout } from "./additionUtils";
import type { WidgetProps } from "widgets/BaseWidget";
import { createSectionAndAddWidget } from "./sectionUtils";
import type BaseLayoutComponent from "layoutSystems/anvil/layoutComponents/BaseLayoutComponent";
import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import { call } from "redux-saga/effects";
import { SectionWidget } from "widgets/anvil/SectionWidget";
import {
  severTiesFromParents,
  severTiesFromParentsUpdates,
  transformMovedWidgets,
} from "./moveUtils";
import { getUpdateItem } from "../../widgetUtils";

export function* addWidgetsToMainCanvasLayout(
  allWidgets: CanvasWidgetsReduxState,
  draggedWidgets: WidgetLayoutProps[],
  highlight: AnvilHighlightInfo,
  updatesPayload: CrudWidgetsPayload,
) {
  let canvasWidgets: CanvasWidgetsReduxState = { ...allWidgets };
  let newUpdatesPayload: CrudWidgetsPayload = { ...updatesPayload };
  /**
   * Step 1: Get layout for MainCanvas.
   */
  let mainCanvasWidget: WidgetProps = allWidgets[highlight.canvasId];
  let mainCanvasPreset: LayoutProps[] = mainCanvasWidget.layout;
  let mainCanvasLayout: LayoutProps | undefined = getAffectedLayout(
    mainCanvasPreset,
    highlight.layoutOrder,
  );

  if (!mainCanvasLayout) return allWidgets;

  /**
   * Step 2: Split widgets into sections and non sections.
   */
  const [sections, nonSections] = splitWidgets(draggedWidgets);

  /**
   * Step 3: Add section widgets to the MainCanvasLayout.
   */
  const Comp: typeof BaseLayoutComponent = LayoutFactory.get(
    mainCanvasLayout.layoutType,
  );

  sections.forEach((section: WidgetLayoutProps) => {
    const res: { canvas: WidgetProps; canvasLayout: LayoutProps } =
      addSectionToMainCanvasLayout(
        mainCanvasWidget,
        mainCanvasLayout as LayoutProps,
        Comp,
        highlight,
        section,
      );
    mainCanvasWidget = res.canvas;
    mainCanvasLayout = res.canvasLayout;
    canvasWidgets = {
      ...canvasWidgets,
      [section.widgetId]: {
        ...canvasWidgets[section.widgetId],
        parentId: mainCanvasWidget.widgetId,
      },
    };

    newUpdatesPayload = {
      ...newUpdatesPayload,
      update: {
        ...newUpdatesPayload.update,
        [section.widgetId]: [
          getUpdateItem("parentId", mainCanvasWidget.widgetId),
        ],
      },
    };
  });

  /**
   * Step 4: Create a section to parent all non section widgets.
   *         and add it to the main canvas.
   */

  if (nonSections.length) {
    const res: {
      canvasWidgets: CanvasWidgetsReduxState;
      updatesPayload: CrudWidgetsPayload;
      section: WidgetProps;
    } = yield call(
      createSectionAndAddWidget,
      canvasWidgets,
      highlight,
      draggedWidgets,
      highlight.canvasId,
      newUpdatesPayload,
    );
    console.log("#### after create section", {
      updatesPayload: res.updatesPayload,
    });
    newUpdatesPayload = res.updatesPayload;
    mainCanvasWidget = {
      ...mainCanvasWidget,
      children: [...mainCanvasWidget.children, res.section.widgetId],
    };

    mainCanvasLayout = addWidgetsToChildTemplate(
      mainCanvasLayout,
      LayoutFactory.get(mainCanvasLayout.layoutType),
      [
        {
          alignment: highlight.alignment,
          widgetId: res.section.widgetId,
          widgetType: res.section.type,
        },
      ],
      highlight,
    );
    canvasWidgets = res.canvasWidgets;
  }

  /**
   * Step 5: Update the MainCanvasLayout preset with the updated layout.
   */
  mainCanvasPreset = [mainCanvasLayout];

  /**
   * Step 6: Update the MainCanvasWidget with the updated preset.
   * Also add the new section widget to its children.
   */

  return {
    widgets: {
      ...canvasWidgets,
      [mainCanvasWidget.widgetId]: {
        ...mainCanvasWidget,
        layout: mainCanvasPreset,
      },
    },
    updatesPayload: {
      ...newUpdatesPayload,
      update: {
        ...newUpdatesPayload.update,
        [mainCanvasWidget.widgetId]: [
          ...(newUpdatesPayload.update?.[mainCanvasWidget.widgetId] || []),
          getUpdateItem("layout", mainCanvasPreset),
          getUpdateItem("children", mainCanvasWidget.children),
        ],
      },
    },
  };
}

/**
 * Split widgets into two groups depending on their type === SECTION_WIDGET.
 * @param widgets | WidgetLayoutProps[] : List of dragged widgets.
 * @returns WidgetLayoutProps[][] : List of dragged widgets split by type.
 */
function splitWidgets(widgets: WidgetLayoutProps[]): WidgetLayoutProps[][] {
  const sections: WidgetLayoutProps[] = [];
  const nonSections: WidgetLayoutProps[] = [];
  widgets.forEach((widget: WidgetLayoutProps) => {
    if (widget.widgetType === SectionWidget.type) {
      sections.push(widget);
    } else {
      nonSections.push(widget);
    }
  });
  return [sections, nonSections];
}

function addSectionToMainCanvasLayout(
  canvasProps: WidgetProps,
  mainCanvasLayout: LayoutProps,
  mainCanvasComp: typeof BaseLayoutComponent,
  highlight: AnvilHighlightInfo,
  section: WidgetLayoutProps,
): { canvas: WidgetProps; canvasLayout: LayoutProps } {
  /**
   * Step 1: Add section widgetIds to canvas.children.
   */
  canvasProps.children = [...canvasProps.children, section.widgetId];

  /**
   * Step 2: Add section to mainCanvas layout.
   */
  mainCanvasLayout = addWidgetsToChildTemplate(
    mainCanvasLayout,
    LayoutFactory.get(mainCanvasLayout.layoutType),
    [section],
    highlight,
  );

  return {
    canvas: canvasProps,
    canvasLayout: mainCanvasLayout,
  };
}

export function* moveWidgetsToMainCanvas(
  allWidgets: CanvasWidgetsReduxState,
  movedWidgets: string[],
  highlight: AnvilHighlightInfo,
) {
  let widgets: CanvasWidgetsReduxState = { ...allWidgets };
  let updatesPayload: CrudWidgetsPayload = {
    add: {},
    remove: [],
    update: {},
  };
  /**
   * Step 1: Remove moved widgets from previous parents.
   */
  const res = severTiesFromParentsUpdates(
    widgets,
    movedWidgets,
    updatesPayload,
  );
  widgets = res.widgets;
  updatesPayload = res.updatesPayload;
  /**
   * Step 2: Add moved widgets to the MainCanvas.
   */
  widgets = yield call(
    addWidgetsToMainCanvasLayout,
    widgets,
    transformMovedWidgets(widgets, movedWidgets, highlight),
    highlight,
    updatesPayload,
  );

  return widgets;
}
