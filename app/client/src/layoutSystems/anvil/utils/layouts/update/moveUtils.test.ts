import { generateLayoutComponentMock } from "mocks/layoutComponents/layoutComponentMock";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import type {
  LayoutComponentProps,
  LayoutProps,
  WidgetLayoutProps,
} from "../../anvilTypes";
import { mockCanvasProps } from "mocks/widgetProps/canvas";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { moveWidgets, updateWidgetRelationships } from "./moveUtils";
import { mockAnvilHighlightInfo } from "mocks/mockHighlightInfo";
import {
  extractWidgetIdsFromLayoutProps,
  registerLayoutComponents,
} from "../layoutUtils";

describe("Layouts - moveUtils test", () => {
  beforeAll(() => {
    registerLayoutComponents();
  });
  describe("updateWidgetRelationships", () => {
    it("should disconnect widgets from old parent and add to new parent", () => {
      const canvas1: BaseWidgetProps = mockCanvasProps();
      const mock1 = generateLayoutComponentMock();
      const layout1: LayoutComponentProps = mock1.layout;

      canvas1.children = [
        (layout1.layout[0] as WidgetLayoutProps).widgetId,
        (layout1.layout[1] as WidgetLayoutProps).widgetId,
      ];
      canvas1.layout = [layout1];
      const canvas2: BaseWidgetProps = mockCanvasProps();
      const movedWidget: WidgetLayoutProps = layout1
        .layout[0] as WidgetLayoutProps;
      const state: CanvasWidgetsReduxState = {
        [canvas1.widgetId]: canvas1,
        [movedWidget.widgetId]: {
          ...mock1?.childrenMap[movedWidget.widgetId],
          parentId: canvas1.widgetId,
        },
        [(layout1.layout[1] as WidgetLayoutProps).widgetId]: {
          ...mock1?.childrenMap[
            (layout1.layout[1] as WidgetLayoutProps).widgetId
          ],
          parentId: canvas1.widgetId,
        },
        [canvas2.widgetId]: canvas2,
      };

      const res: CanvasWidgetsReduxState = updateWidgetRelationships(
        state,
        [movedWidget.widgetId],
        mockAnvilHighlightInfo({ canvasId: canvas2.widgetId }),
      );

      expect(res[canvas1.widgetId].children?.length).toEqual(1);
      expect(res[movedWidget.widgetId].parentId).toEqual(canvas2.widgetId);
      expect(res[canvas1.widgetId].layout[0].layout.length).toEqual(1);
    });
    it("should not update any relationship if the widgets are moved within the same parent", () => {
      const canvas1: BaseWidgetProps = mockCanvasProps();
      const mock1 = generateLayoutComponentMock();
      const layout1: LayoutComponentProps = mock1.layout;

      if (!mock1.childrenMap) throw new Error("childrenMap is undefined");

      canvas1.children = [layout1.layout[0], layout1.layout[1]];
      canvas1.layout = [layout1];
      const movedWidget: WidgetLayoutProps = layout1
        .layout[0] as WidgetLayoutProps;
      const state: CanvasWidgetsReduxState = {
        [canvas1.widgetId]: canvas1,
        [movedWidget.widgetId]: {
          ...mock1?.childrenMap[movedWidget.widgetId],
          parentId: canvas1.widgetId,
        },
        [(layout1.layout[1] as WidgetLayoutProps).widgetId]: {
          ...mock1?.childrenMap[
            (layout1.layout[1] as WidgetLayoutProps).widgetId
          ],
          parentId: canvas1.widgetId,
        },
      };

      expect(state[canvas1.widgetId].children?.length).toEqual(2);
      expect(state[movedWidget.widgetId].parentId).toEqual(canvas1.widgetId);
      const res: CanvasWidgetsReduxState = updateWidgetRelationships(
        state,
        [movedWidget.widgetId],
        mockAnvilHighlightInfo({ canvasId: canvas1.widgetId }),
      );

      expect(res[canvas1.widgetId].children?.length).toEqual(2);
      expect(res[movedWidget.widgetId].parentId).toEqual(canvas1.widgetId);
    });
  });
  describe("moveWidgets", () => {
    it("should update relationships and layouts properly", () => {
      const canvas1: BaseWidgetProps = mockCanvasProps();
      const mock1 = generateLayoutComponentMock();
      const layout1: LayoutComponentProps = mock1.layout;

      if (!mock1.childrenMap) return;

      canvas1.children = [
        (layout1.layout[0] as WidgetLayoutProps).widgetId,
        (layout1.layout[1] as WidgetLayoutProps).widgetId,
      ];
      canvas1.layout = [layout1];
      const canvas2: BaseWidgetProps = mockCanvasProps();

      canvas2.children = [];
      canvas2.layout = [
        generateLayoutComponentMock({ layout: [] }).layout as LayoutProps,
      ];
      const movedWidget: WidgetLayoutProps = layout1
        .layout[0] as WidgetLayoutProps;
      const state: CanvasWidgetsReduxState = {
        [canvas1.widgetId]: canvas1,
        [movedWidget.widgetId]: {
          ...mock1?.childrenMap[movedWidget.widgetId],
          parentId: canvas1.widgetId,
        },
        [(layout1.layout[1] as WidgetLayoutProps).widgetId]: {
          ...mock1?.childrenMap[
            (layout1.layout[1] as WidgetLayoutProps).widgetId
          ],
          parentId: canvas1.widgetId,
        },
        [canvas2.widgetId]: canvas2,
      };

      const res: CanvasWidgetsReduxState = moveWidgets(
        state,
        [movedWidget.widgetId],
        mockAnvilHighlightInfo({
          canvasId: canvas2.widgetId,
          layoutOrder: [canvas2.layout[0].layoutId],
        }),
      );

      expect(res[canvas1.widgetId].children?.length).toEqual(1);
      expect(res[movedWidget.widgetId].parentId).toEqual(canvas2.widgetId);
      expect(res[canvas1.widgetId].layout[0].layout.length).toEqual(1);
      expect(res[canvas2.widgetId].children?.length).toEqual(1);
      expect(res[canvas2.widgetId].layout[0].layout.length).toEqual(1);
      expect(
        extractWidgetIdsFromLayoutProps(
          res[canvas2.widgetId].layout[0],
        ).includes(movedWidget.widgetId),
      ).toBeTruthy();
    });
    it("should update relationships and layouts properly for multiple moved widgets", () => {
      const canvas1: BaseWidgetProps = mockCanvasProps();
      const mock1 = generateLayoutComponentMock({
        isPermanent: true,
      });
      const layout1: LayoutComponentProps = mock1.layout;

      canvas1.children = [
        (layout1.layout[0] as WidgetLayoutProps).widgetId,
        (layout1.layout[1] as WidgetLayoutProps).widgetId,
      ];
      canvas1.layout = [layout1];

      const canvas2: BaseWidgetProps = mockCanvasProps();
      const mock2 = generateLayoutComponentMock();
      const layout2: LayoutComponentProps = mock2.layout;

      canvas2.children = [
        (layout2.layout[0] as WidgetLayoutProps).widgetId,
        (layout2.layout[1] as WidgetLayoutProps).widgetId,
      ];
      canvas2.layout = [layout2];

      if (!mock1.childrenMap || !mock2.childrenMap)
        throw new Error("One of the childrenMaps is undefined");

      const movedWidgetIds: string[] = [
        ...canvas1.children,
        canvas2.children[1],
      ];
      const state: CanvasWidgetsReduxState = {
        [canvas1.widgetId]: canvas1,
        [(layout1.layout[0] as WidgetLayoutProps).widgetId]: {
          ...mock1?.childrenMap[
            (layout1.layout[0] as WidgetLayoutProps).widgetId
          ],
          parentId: canvas1.widgetId,
        },
        [(layout1.layout[1] as WidgetLayoutProps).widgetId]: {
          ...mock1?.childrenMap[
            (layout1.layout[1] as WidgetLayoutProps).widgetId
          ],
          parentId: canvas1.widgetId,
        },
        [canvas2.widgetId]: canvas2,
        [(layout2.layout[0] as WidgetLayoutProps).widgetId]: {
          ...mock2?.childrenMap[
            (layout2.layout[0] as WidgetLayoutProps).widgetId
          ],
          parentId: canvas2.widgetId,
        },
        [(layout2.layout[1] as WidgetLayoutProps).widgetId]: {
          ...mock2?.childrenMap[
            (layout2.layout[1] as WidgetLayoutProps).widgetId
          ],
          parentId: canvas2.widgetId,
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
        extractWidgetIdsFromLayoutProps(
          res[canvas2.widgetId].layout[0],
        ).includes(movedWidgetIds[1]),
      ).toBeTruthy();
    });
  });
});
