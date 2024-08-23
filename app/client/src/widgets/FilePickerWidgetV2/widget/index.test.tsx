import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { ThemeProvider } from "styled-components";
import { createMemoryHistory, History } from "history";
import { Router } from "react-router-dom";

import "@testing-library/jest-dom";

import FilePickerWidget from "./";
import type { FilePickerWidgetProps } from "widgets/FilepickerWidget/widget";
import FileDataTypes from "widgets/FilepickerWidget/widget/FileDataTypes";
import { lightTheme } from "selectors/themeSelectors";

const mockFileWidgetprops: FilePickerWidgetProps = {
  allowedFileTypes: ["image/*", "application/pdf", "video/*"],
  label: "File",
  maxNumFiles: 5,
  maxFileSize: 8800,
  selectedFiles: [
    {
      name: "test.png",
      type: "image/jpeg",
      data: "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA",
    },
    {
      name: "pic.png",
      type: "image/png",
      data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA",
    },
    {
      name: "samplepdf.pdf",
      type: "application/pdf",
      data: "data:application/pdf;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA",
    },
    {
      name: "example_video.mp4",
      type: "video/webm",
      data: "data:video/webm;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA",
    },
  ],
  onFilesSelected: "Files selected",
  fileDataType: FileDataTypes.Base64,
  isRequired: true,
  widgetId: "Widget1",
  type: "",
  widgetName: "File Picker 1",
  renderMode: "CANVAS",
  updateWidgetMetaProperty: jest.fn(),
  backgroundColor: "#FAFAFA",
  borderRadius: "2px",

  version: 0,
  parentColumnSpace: 0,
  parentRowSpace: 0,
  leftColumn: 0,
  rightColumn: 0,
  topRow: 0,
  bottomRow: 0,
  isLoading: false,
};

describe("<FilePickerWidget />", () => {
  const initialState = {
    ui: {
      appSettingsPane: {
        isOpen: false,
      },
      widgetDragResize: {
        lastSelectedWidget: "Widget1",
        selectedWidgets: ["Widget1"],
      },
      users: {
        featureFlag: {
          data: {},
        },
      },
      propertyPane: {
        isVisible: true,
        widgetId: "Widget1",
      },
      debugger: {
        errors: {},
      },
      editor: {
        isPreviewMode: false,
      },
      widgetReflow: {
        enableReflow: true,
      },
      autoHeightUI: {
        isAutoHeightWithLimitsChanging: false,
      },
      mainCanvas: {
        width: 1159,
      },
      canvasSelection: {
        isDraggingForSelection: false,
      },
    },
    entities: { canvasWidgets: {}, app: { mode: "canvas" } },
  };

  const renderFilePickerWidget = (
    props: FilePickerWidgetProps,
    history: History<unknown>,
  ) => {
    const store = configureStore()(initialState);
    return render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router history={history}>
            <FilePickerWidget borderRadius="5px" {...props} />
          </Router>
        </ThemeProvider>
      </Provider>,
    );
  };

  it("should render thumbnail correctly even if we move from the canvas and coming back to the widget", async () => {
    const history = createMemoryHistory();
    history.push("/edit/widgets");

    renderFilePickerWidget(mockFileWidgetprops, history);

    const filePickerOpenerBtn = screen.getByText("4 files selected");
    fireEvent.click(filePickerOpenerBtn);

    await waitFor(() => {
      const filesWithThumbnail = screen.getAllByRole("listitem");
      expect(filesWithThumbnail).toHaveLength(4);
    });

    // Simulate navigating away from canvas
    history.push("/edit/queries");

    // Simulate navigating back to the widget
    history.push("/edit/widgets");

    // Verify that thumbnails are still present
    await waitFor(() => {
      const filesWithThumbnail = screen.getAllByRole("listitem");
      filesWithThumbnail.forEach((element) => {
        const thumbnail = element.querySelector(".uppy-Dashboard-Item-preview");
        const thumbnailImg = thumbnail?.firstChild;
        expect(thumbnailImg).toHaveClass(
          "uppy-Dashboard-Item-previewInnerWrap",
        );
      });
      expect(filesWithThumbnail).toHaveLength(4);
    });
  });
});
