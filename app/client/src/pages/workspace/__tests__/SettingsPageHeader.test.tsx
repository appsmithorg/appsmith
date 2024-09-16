import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "test/testUtils";
import { SettingsPageHeader } from "../SettingsPageHeader";
import userEvent from "@testing-library/user-event";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let container: any = null;
const handleChange = jest.fn();
const mockOnSelect = jest.fn();

const pageMenuItems = [
  {
    icon: "book-line",
    onSelect: mockOnSelect,
    text: "Documentation",
  },
];

function renderComponent() {
  render(
    <SettingsPageHeader
      buttonText="Add"
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSearch={handleChange as any}
      pageMenuItems={pageMenuItems}
      searchPlaceholder="Search users"
      showMoreOptions={false}
      title={"Settings"}
    />,
  );
}

describe("<PageHeader />", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  it("is rendered", () => {
    renderComponent();
    const searchInput = screen.queryAllByTestId("t--search-input");
    expect(searchInput).toHaveLength(1);
  });
  it("should search and filter results for the given search query", async () => {
    renderComponent();
    const searchInput = screen.queryAllByTestId("t--search-input");
    await userEvent.type(searchInput[0], "test value");
    expect(searchInput[0]).toHaveValue("test value");
  });
  it("should have a button with text Add", () => {
    renderComponent();
    const button = screen.queryAllByTestId("t--page-header-input");
    expect(button).toHaveLength(1);
    expect(button[0]).toHaveTextContent("Add");
  });
  it("should show menu options on click of more", async () => {
    const { queryAllByTestId, queryAllByText } = render(
      <SettingsPageHeader
        buttonText="Add"
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onSearch={handleChange as any}
        pageMenuItems={pageMenuItems}
        searchPlaceholder="Search users"
        showMoreOptions
        title={"Settings"}
      />,
    );
    const moreMenu = queryAllByTestId("t--page-header-actions");
    let menuOptions = queryAllByText(/Documentation/i);
    expect(menuOptions).toHaveLength(0);

    await userEvent.click(moreMenu[0]);

    menuOptions = queryAllByText(/Documentation/i);
    expect(menuOptions).toHaveLength(1);

    await userEvent.click(menuOptions[0]);
    expect(pageMenuItems[0].onSelect).toHaveBeenCalled();
  });
});
