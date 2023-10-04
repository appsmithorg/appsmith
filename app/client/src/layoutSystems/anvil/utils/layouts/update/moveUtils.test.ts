import { generateLayoutComponentMock } from "mocks/layoutComponents/layoutComponentMock";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import type { LayoutComponentProps } from "../../anvilTypes";
import { mockCanvasProps } from "mocks/widgetProps/canvas";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { moveWidgets, updateWidgetRelationships } from "./moveUtils";
import { mockAnvilHighlightInfo } from "mocks/mockHighlightInfo";
import { registerLayoutComponents } from "../layoutUtils";

describe("Layouts - moveUtils test", () => {
  beforeAll(() => {
    registerLayoutComponents();
  });
  describe("updateWidgetRelationships", () => {
    it("should disconnect widgets from old parent and add to new parent", () => {
      const canvas1: BaseWidgetProps = mockCanvasProps();
      const layout1: LayoutComponentProps = generateLayoutComponentMock();
      if (!layout1.childrenMap) return;
      canvas1.children = [layout1.layout[0], layout1.layout[1]];
      canvas1.layout = [layout1];
      const canvas2: BaseWidgetProps = mockCanvasProps();
      const movedWidgetId = layout1.layout[0] as string;
      const state: CanvasWidgetsReduxState = {
        [canvas1.widgetId]: canvas1,
        [movedWidgetId]: {
          ...layout1?.childrenMap[layout1.layout[0] as string],
          parentId: canvas1.widgetId,
        },
        [layout1.layout[1] as string]: {
          ...layout1?.childrenMap[layout1.layout[1] as string],
          parentId: canvas1.widgetId,
        },
        [canvas2.widgetId]: canvas2,
      };

      const res: CanvasWidgetsReduxState = updateWidgetRelationships(
        state,
        [movedWidgetId],
        mockAnvilHighlightInfo({ canvasId: canvas2.widgetId }),
      );
      expect(res[canvas1.widgetId].children?.length).toEqual(1);
      expect(res[movedWidgetId].parentId).toEqual(canvas2.widgetId);
      expect(res[canvas1.widgetId].layout[0].layout.length).toEqual(1);
    });
    it("should not update any relationship if the widgets are moved within the same parent", () => {
      const canvas1: BaseWidgetProps = mockCanvasProps();
      const layout1: LayoutComponentProps = generateLayoutComponentMock();
      if (!layout1.childrenMap) return;
      canvas1.children = [layout1.layout[0], layout1.layout[1]];
      canvas1.layout = [layout1];
      const movedWidgetId = layout1.layout[0] as string;
      const state: CanvasWidgetsReduxState = {
        [canvas1.widgetId]: canvas1,
        [movedWidgetId]: {
          ...layout1?.childrenMap[layout1.layout[0] as string],
          parentId: canvas1.widgetId,
        },
        [layout1.layout[1] as string]: {
          ...layout1?.childrenMap[layout1.layout[1] as string],
          parentId: canvas1.widgetId,
        },
      };
      expect(state[canvas1.widgetId].children?.length).toEqual(2);
      expect(state[movedWidgetId].parentId).toEqual(canvas1.widgetId);
      const res: CanvasWidgetsReduxState = updateWidgetRelationships(
        state,
        [movedWidgetId],
        mockAnvilHighlightInfo({ canvasId: canvas1.widgetId }),
      );
      expect(res[canvas1.widgetId].children?.length).toEqual(2);
      expect(res[movedWidgetId].parentId).toEqual(canvas1.widgetId);
    });
  });
  describe("moveWidgets", () => {
    it("should update relationships and layouts properly", () => {
      const canvas1: BaseWidgetProps = mockCanvasProps();
      const layout1: LayoutComponentProps = generateLayoutComponentMock();
      if (!layout1.childrenMap) return;
      canvas1.children = [layout1.layout[0], layout1.layout[1]];
      canvas1.layout = [layout1];
      const canvas2: BaseWidgetProps = mockCanvasProps();
      canvas2.children = [];
      canvas2.layout = [generateLayoutComponentMock({ layout: [] })];
      const movedWidgetId = layout1.layout[0] as string;
      const state: CanvasWidgetsReduxState = {
        [canvas1.widgetId]: canvas1,
        [movedWidgetId]: {
          ...layout1?.childrenMap[layout1.layout[0] as string],
          parentId: canvas1.widgetId,
        },
        [layout1.layout[1] as string]: {
          ...layout1?.childrenMap[layout1.layout[1] as string],
          parentId: canvas1.widgetId,
        },
        [canvas2.widgetId]: canvas2,
      };

      const res: CanvasWidgetsReduxState = moveWidgets(
        state,
        [movedWidgetId],
        mockAnvilHighlightInfo({
          canvasId: canvas2.widgetId,
          layoutOrder: [canvas2.layout[0].layoutId],
        }),
      );
      expect(res[canvas1.widgetId].children?.length).toEqual(1);
      expect(res[movedWidgetId].parentId).toEqual(canvas2.widgetId);
      expect(res[canvas1.widgetId].layout[0].layout.length).toEqual(1);
      expect(res[canvas2.widgetId].children?.length).toEqual(1);
      expect(res[canvas2.widgetId].layout[0].layout.length).toEqual(1);
      expect(res[canvas2.widgetId].layout[0].layout[0]).toEqual(movedWidgetId);
    });
    it("should update relationships and layouts properly for multiple moved widgets", () => {
      const canvas1: BaseWidgetProps = mockCanvasProps();
      const layout1: LayoutComponentProps = generateLayoutComponentMock({
        isPermanent: true,
      });

      canvas1.children = [layout1.layout[0], layout1.layout[1]];
      canvas1.layout = [layout1];

      const canvas2: BaseWidgetProps = mockCanvasProps();
      const layout2: LayoutComponentProps = generateLayoutComponentMock();
      canvas2.children = [layout2.layout[0], layout2.layout[1]];
      canvas2.layout = [layout2];
      if (!layout1.childrenMap || !layout2.childrenMap) return;
      const movedWidgetIds: string[] = [
        layout1.layout[0] as string,
        layout1.layout[1] as string,
        layout2.layout[1] as string,
      ];
      const state: CanvasWidgetsReduxState = {
        [canvas1.widgetId]: canvas1,
        [layout1.layout[0] as string]: {
          ...layout1?.childrenMap[layout1.layout[0] as string],
          parentId: canvas1.widgetId,
        },
        [layout1.layout[1] as string]: {
          ...layout1?.childrenMap[layout1.layout[1] as string],
          parentId: canvas1.widgetId,
        },
        [canvas2.widgetId]: canvas2,
        [layout2.layout[0] as string]: {
          ...layout2?.childrenMap[layout2.layout[0] as string],
          parentId: canvas1.widgetId,
        },
        [layout2.layout[1] as string]: {
          ...layout2?.childrenMap[layout2.layout[1] as string],
          parentId: canvas1.widgetId,
        },
      };

      const res: CanvasWidgetsReduxState = moveWidgets(
        state,
        movedWidgetIds,
        mockAnvilHighlightInfo({
          canvasId: canvas2.widgetId,
          layoutOrder: [canvas2.layout[0].layoutId],
        }),
      );
      expect(res[canvas1.widgetId].children?.length).toEqual(0);
      expect(res[movedWidgetIds[0]].parentId).toEqual(canvas2.widgetId);
      expect(res[canvas1.widgetId].layout[0].layout.length).toEqual(0);
      expect(res[canvas2.widgetId].children?.length).toEqual(4);
      expect(res[canvas2.widgetId].layout[0].layout.length).toEqual(4);
      expect(
        res[canvas2.widgetId].layout[0].layout.includes(movedWidgetIds[1]),
      ).toBeTruthy();
    });
  });
});
