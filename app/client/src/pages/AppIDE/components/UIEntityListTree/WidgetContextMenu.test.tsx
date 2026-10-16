import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "@appsmith/ads";
import { act } from "react-dom/test-utils";
import { WidgetContextMenu } from "./WidgetContextMenu";

jest.mock("@appsmith/ads", () => {
  const React = jest.requireActual("react");
  const MenuContext = React.createContext(null);

  return {
    Button: ({ children, ...props }) =>
      React.createElement(
        "button",
        { "data-testid": props["data-testid"], onClick: props.onClick },
        children,
      ),
    Menu: ({ children, onOpenChange, open }) =>
      React.createElement(
        MenuContext.Provider,
        { value: { open, onOpenChange } },
        children,
      ),
    MenuContent: ({ children }) =>
      React.createElement(MenuContext.Consumer, null, ({ open }) =>
        open ? React.createElement("div", null, children) : null,
      ),
    MenuItem: ({ children, disabled, onClick }) =>
      React.createElement("button", { disabled, onClick }, children),
    MenuSeparator: () => null,
    MenuTrigger: ({ children }) =>
      React.createElement(MenuContext.Consumer, null, ({ onOpenChange }) =>
        React.cloneElement(children, { onClick: () => onOpenChange() }),
      ),
    toast: { show: jest.fn() },
  };
});

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock("sagas/selectors", () => ({
  getWidgetByID: jest.fn(() => jest.fn()),
}));

jest.mock(
  "ee/entities/DataTree/types",
  () => ({
    ENTITY_TYPE: { WIDGET: "WIDGET" },
  }),
  { virtual: true },
);

jest.mock(
  "actions/explorerActions",
  () => ({
    initExplorerEntityNameEdit: jest.fn(),
  }),
  { virtual: true },
);

jest.mock("./hooks/useDeleteWidget", () => ({
  useDeleteWidget: jest.fn(() => jest.fn()),
}));

jest.mock(
  "components/editorComponents/Debugger/StateInspector/CTAs",
  () => ({
    InspectStateMenuItem: () => null,
  }),
  { virtual: true },
);

jest.mock(
  "pages/Editor/Explorer/Entity",
  () => ({
    EntityClassNames: {
      CONTEXT_MENU_CONTENT: "t--entity-context-menu-content",
    },
  }),
  { virtual: true },
);

const widget = {
  widgetName: "Table1",
  isDeletable: true,
};

describe("WidgetContextMenu", () => {
  const mockWriteText = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useDispatch as jest.Mock).mockReturnValue(jest.fn());
    (useSelector as jest.Mock).mockReturnValue(widget);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: mockWriteText },
    });
  });

  const openMenu = async () => {
    const result = render(
      <WidgetContextMenu canManagePages widgetId="widget-id" />,
    );
    const trigger = result.getByRole("button");

    act(() => {
      fireEvent.click(trigger);
    });

    return result;
  };

  it("copies the widget name and confirms success", async () => {
    mockWriteText.mockResolvedValue(undefined);
    const showToast = jest.spyOn(toast, "show");
    const { findByText } = await openMenu();

    fireEvent.click(await findByText("Copy widget name"));

    await waitFor(() => expect(mockWriteText).toHaveBeenCalledWith("Table1"));
    expect(showToast).toHaveBeenCalledWith("Widget name copied to clipboard", {
      kind: "success",
    });
  });

  it("shows an error when clipboard access fails", async () => {
    mockWriteText.mockRejectedValue(new Error("Clipboard unavailable"));
    const showToast = jest.spyOn(toast, "show");
    const { findByText } = await openMenu();

    fireEvent.click(await findByText("Copy widget name"));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith("Could not copy widget name", {
        kind: "error",
      }),
    );
  });
});
