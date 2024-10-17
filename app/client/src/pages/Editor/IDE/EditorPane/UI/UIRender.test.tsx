import React from "react";
import { Route } from "react-router-dom";
import { render } from "test/testUtils";
import IDE from "pages/Editor/IDE/index";
import { BUILDER_PATH } from "ee/constants/routes/appRoutes";
import { getIDETestState } from "test/factories/AppIDEFactoryUtils";
import { PageFactory } from "test/factories/PageFactory";
import { EDITOR_PANE_TEXTS, createMessage } from "ee/constants/messages";
import { UpdatedEditor } from "test/testMockedWidgets";
import {
  buildChildren,
  widgetCanvasFactory,
} from "test/factories/WidgetFactoryUtils";
import { EditorViewMode } from "ee/entities/IDE/constants";

const FeatureFlags = {
  rollout_side_by_side_enabled: true,
};

const pageId = "0123456789abcdef00000000";

describe("IDE URL rendering: UI", () => {
  it("Empty canvas: Render UI add state", async () => {
    const page = PageFactory.build();

    const state = getIDETestState({
      pages: [page],
    });
    const { getByTestId } = render(
      <Route path={BUILDER_PATH}>
        <IDE />
      </Route>,
      {
        url: `/app/applicationSlug/pageSlug-${pageId}/edit`,
        featureFlags: FeatureFlags,
        initialState: state,
      },
    );

    getByTestId("t--widget-sidebar-scrollable-wrapper");
  });

  it("Empty canvas: Render UI list state", async () => {
    const page = PageFactory.build();

    const state = getIDETestState({
      pages: [page],
    });
    const { getByRole, getByText } = render(
      <Route path={BUILDER_PATH}>
        <IDE />
      </Route>,
      {
        url: `/app/applicationSlug/pageSlug-${pageId}/edit/widgets`,
        featureFlags: FeatureFlags,
        initialState: state,
      },
    );

    // check for blank state message and button
    getByText(createMessage(EDITOR_PANE_TEXTS.widget_blank_state_description));
    getByRole("button", {
      name: createMessage(EDITOR_PANE_TEXTS.widget_add_button),
    });
  });

  it("Selected widget in canvas: Render UI list state", async () => {
    const page = PageFactory.build();

    const state = getIDETestState({
      pages: [page],
    });

    const widgetID = "tableWidgetId";
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const children: any = buildChildren([
      {
        type: "TABLE_WIDGET",
        topRow: 15,
        bottomRow: 25,
        leftColumn: 5,
        rightColumn: 15,
        widgetId: widgetID,
      },
    ]);
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dsl: any = widgetCanvasFactory.build({
      children,
    });

    dsl.bottomRow = 250;

    const url =
      `/app/applicationSlug/pageSlug-${pageId}/edit/widgets/` + widgetID;

    const component = render(
      <Route path={BUILDER_PATH}>
        <UpdatedEditor dsl={dsl} />
      </Route>,
      {
        url,
        featureFlags: FeatureFlags,
        initialState: state,
      },
    );

    // wait for the dom to settle down by waitng for the canvas to be loaded
    await component.findByTestId("t--canvas-artboard");

    // check for list UI
    component.getByTestId(`t--entity-item-${children[0].widgetName}`);
  });

  it("Canvas: Check tabs rendering in side by side mode", () => {
    const page = PageFactory.build();

    const state = getIDETestState({
      pages: [page],
      ideView: EditorViewMode.SplitScreen,
    });
    const { queryByTestId } = render(
      <Route path={BUILDER_PATH}>
        <IDE />
      </Route>,
      {
        url: `/app/applicationSlug/pageSlug-${pageId}/edit`,
        featureFlags: FeatureFlags,
        initialState: state,
      },
    );

    expect(queryByTestId("t--editor-tabs")).toBeFalsy();
  });
});
