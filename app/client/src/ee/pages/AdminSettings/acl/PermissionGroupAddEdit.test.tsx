import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "test/testUtils";
import {
  PermissionGroupAddEdit,
  PermissionGroupEditProps,
} from "./PermissionGroupAddEdit";
import { permissionGroupTableData } from "./PermissionGroupListing";

let container: any = null;

const props: PermissionGroupEditProps = {
  selected: permissionGroupTableData[0],
  onClone: jest.fn(),
  onDelete: jest.fn(),
};

function renderComponent() {
  return render(<PermissionGroupAddEdit {...props} />);
}

describe("<PermissionGroupAddEdit />", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  it("is rendered", () => {
    renderComponent();
    const permissionGroup = screen.queryAllByTestId(
      "t--permission-edit-wrapper",
    );
    expect(permissionGroup).toHaveLength(1);
  });
  it("should render the selected permission group name as title", () => {
    renderComponent();
    const title = screen.queryAllByTestId("t--editatble-title");
    expect(title[0]).toHaveTextContent(props.selected.permissionName);
  });
});
