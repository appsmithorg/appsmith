import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PartialExportModal } from "./index";
import { lightTheme } from "selectors/themeSelectors";
import { ThemeProvider } from "styled-components";
import configureStore from "redux-mock-store";
import { Provider } from "react-redux";
import { defaultAppState } from "./unitTestUtils";
import { PARTIAL_IMPORT_EXPORT, createMessage } from "ee/constants/messages";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

interface TestEntityResetProps {
  entityTitle: string;
  entityItemTitle: string;
}

const mockStore = configureStore([]);

jest.mock("pages/Editor/Explorer/Widgets/WidgetIcon", () => ({
  __esModule: true,
  default: () => <div />,
}));

describe("<PartialExportModal />", () => {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: any;

  beforeEach(() => {
    defaultAppState.ui.applications.partialImportExport.isExportModalOpen =
      true;
    store = mockStore(defaultAppState);
  });

  const BaseComponentRender = () => (
    <Provider store={store}>
      <ThemeProvider theme={lightTheme}>
        <PartialExportModal />
      </ThemeProvider>
    </Provider>
  );

  const testEntityReset = (props: TestEntityResetProps) => {
    const entityResetTestId = `t--partial-export-modal-reset-${props.entityTitle}`;
    const entity = screen.getByText(props.entityTitle);
    const entityItem = screen.getByLabelText(props.entityItemTitle);
    const exportButton = screen.getByTestId("t-partial-export-entities-btn");

    expect(screen.queryByTestId(entityResetTestId)).not.toBeInTheDocument();
    fireEvent.click(entity);
    fireEvent.click(entityItem);
    expect(screen.getByTestId(entityResetTestId)).toBeInTheDocument();
    expect(exportButton).not.toBeDisabled();
    fireEvent.click(screen.getByTestId(entityResetTestId));
    expect(screen.getByLabelText(props.entityItemTitle)).not.toBeChecked();
    expect(screen.queryByTestId(entityResetTestId)).not.toBeInTheDocument();
    expect(exportButton).toBeDisabled();
  };

  it("renders the component with correct props", () => {
    render(<BaseComponentRender />);
    const pageList = defaultAppState.entities.pageList;
    const currentPageName = pageList.pages.find(
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (page: any) => page.pageId === pageList.currentPageId,
    )?.pageName;

    expect(screen.getByText(`Export - ${currentPageName}`)).toBeInTheDocument();
    expect(
      screen.getByText(
        createMessage(PARTIAL_IMPORT_EXPORT.export.modalSubHeading),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        createMessage(PARTIAL_IMPORT_EXPORT.export.sections.jsObjects),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        createMessage(PARTIAL_IMPORT_EXPORT.export.sections.databases),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        createMessage(PARTIAL_IMPORT_EXPORT.export.sections.queries),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        createMessage(PARTIAL_IMPORT_EXPORT.export.sections.customLibs),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        createMessage(PARTIAL_IMPORT_EXPORT.export.sections.widgets),
      ),
    ).toBeInTheDocument();
    expect;
    expect(
      screen.getByText(createMessage(PARTIAL_IMPORT_EXPORT.export.cta)),
    ).toBeInTheDocument();
    expect(screen.getByTestId("t-partial-export-entities-btn")).toBeDisabled();
  });

  it("resets JS objects after an item has been clicked", () => {
    render(<BaseComponentRender />);
    testEntityReset({
      entityTitle: createMessage(
        PARTIAL_IMPORT_EXPORT.export.sections.jsObjects,
      ),
      entityItemTitle: "JSObject1",
    });
  });

  it("resets Databases after an item has been clicked", () => {
    render(<BaseComponentRender />);
    testEntityReset({
      entityTitle: createMessage(
        PARTIAL_IMPORT_EXPORT.export.sections.databases,
      ),
      entityItemTitle: "Movies",
    });
  });

  it("resets Queries after an item has been clicked", () => {
    render(<BaseComponentRender />);
    testEntityReset({
      entityTitle: createMessage(PARTIAL_IMPORT_EXPORT.export.sections.queries),
      entityItemTitle: "Query1",
    });
  });

  it("resets Custom libraries after an item has been clicked", () => {
    render(<BaseComponentRender />);
    testEntityReset({
      entityTitle: createMessage(
        PARTIAL_IMPORT_EXPORT.export.sections.customLibs,
      ),
      entityItemTitle: "jspdf",
    });
  });

  it("resets Widgets after an item has been clicked", () => {
    render(<BaseComponentRender />);
    testEntityReset({
      entityTitle: createMessage(PARTIAL_IMPORT_EXPORT.export.sections.widgets),
      entityItemTitle: "txt_userFullName",
    });
  });

  it("triggers onExportClick with correct action and payload", async () => {
    render(<BaseComponentRender />);
    const exportButton = screen.getByTestId("t-partial-export-entities-btn");
    const jsObjectsEntity = screen.getByText(
      createMessage(PARTIAL_IMPORT_EXPORT.export.sections.jsObjects),
    );
    const jsObjectsEntityItem = screen.getByLabelText(
      defaultAppState.entities.jsActions[0].config.name,
    );
    const jsObjectsEntityItemId =
      defaultAppState.entities.jsActions[0].config.id;

    fireEvent.click(jsObjectsEntity);
    fireEvent.click(jsObjectsEntityItem);
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(store.getActions()).toEqual(
        expect.arrayContaining([
          {
            type: ReduxActionTypes.PARTIAL_EXPORT_INIT,
            payload: {
              jsObjects: [jsObjectsEntityItemId],
              datasources: [],
              customJSLibs: [],
              widgets: [],
              queries: [],
            },
          },
        ]),
      );
    });
  });
});
