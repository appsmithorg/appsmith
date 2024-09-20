import GlobalHotKeys from "pages/Editor/GlobalHotKeys";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import * as utilities from "selectors/editorSelectors";
import * as useCanvasWidthAutoResize from "pages/hooks";

import * as useCanvasDraggingHook from "layoutSystems/fixedlayout/editor/FixedLayoutCanvasArenas/hooks/useCanvasDragging";
import store from "store";
import {
  buildChildren,
  widgetCanvasFactory,
} from "test/factories/WidgetFactoryUtils";
import { sagasToRunForTests } from "test/sagas";
import { MockApplication } from "test/testCommon";
import { UpdateAppViewer, UpdatedEditor } from "test/testMockedWidgets";
import { render } from "test/testUtils";
import { generateReactKey } from "widgets/WidgetUtils";

const pageId = "0123456789abcdef00000000";

describe("ContainerWidget tests", () => {
  const mockGetIsFetchingPage = jest.spyOn(utilities, "getIsFetchingPage");

  jest
    .spyOn(useCanvasWidthAutoResize, "useCanvasWidthAutoResize")
    .mockImplementation(() => true);

  const pushState = jest.spyOn(window.history, "pushState");

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pushState.mockImplementation((state: any, title: any, url: any) => {
    window.document.title = title;
    window.location.pathname = url;
  });
  it("Container widget should not invoke dragging and selection features in View mode", async () => {
    const containerId = generateReactKey();
    const canvasId = generateReactKey();
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const children: any = buildChildren([
      {
        type: "CHECKBOX_WIDGET",
        parentId: canvasId,
      },
      {
        type: "SWITCH_WIDGET",
        parentId: canvasId,
      },
      {
        type: "BUTTON_WIDGET",
        parentId: canvasId,
      },
    ]);
    const canvasWidget = buildChildren([
      {
        type: "CANVAS_WIDGET",
        parentId: containerId,
        children,
        widgetId: canvasId,
      },
    ]);
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const containerChildren: any = buildChildren([
      {
        type: "CONTAINER_WIDGET",
        children: canvasWidget,
        widgetId: containerId,
        parentId: "0",
      },
    ]);
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dsl: any = widgetCanvasFactory.build({
      children: containerChildren,
    });

    mockGetIsFetchingPage.mockImplementation(() => false);
    const spyUseCanvasDragging = jest
      .spyOn(useCanvasDraggingHook, "useCanvasDragging")
      .mockImplementation(() => ({
        showCanvas: true,
      }));
    const appState = store.getState();

    render(
      <MemoryRouter
        initialEntries={[`/app/applicationSlug/pageSlug-${pageId}/`]}
      >
        <MockApplication>
          <GlobalHotKeys>
            <UpdateAppViewer dsl={dsl} />
          </GlobalHotKeys>
        </MockApplication>
      </MemoryRouter>,
      { initialState: appState, sagasToRun: sagasToRunForTests },
    );

    expect(spyUseCanvasDragging).not.toHaveBeenCalled();
    render(
      <MemoryRouter
        initialEntries={[`/app/applicationSlug/pageSlug-${pageId}/edit`]}
      >
        <MockApplication>
          <GlobalHotKeys>
            <UpdatedEditor dsl={dsl} />
          </GlobalHotKeys>
        </MockApplication>
      </MemoryRouter>,
      { initialState: appState, sagasToRun: sagasToRunForTests },
    );
    expect(spyUseCanvasDragging).toHaveBeenCalled();
  });
});
