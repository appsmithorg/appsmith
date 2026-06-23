import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import { Menu, MenuContent, MenuTrigger } from "@appsmith/ads";
import type { Action } from "entities/Action";
import { CopyToApp } from "./CopyToApp";
import { openCopyToAppModal } from "actions/copyToAppActions";
import { CopyToAppEntityType } from "pages/Editor/Explorer/CopyToApp/types";

const mockDispatch = jest.fn();

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

const action = {
  id: "action-1",
  name: "Query1",
  pageId: "page-1",
} as unknown as Action;

describe("CopyToApp query menu item", () => {
  beforeEach(() => mockDispatch.mockClear());

  it("dispatches openCopyToAppModal with the action descriptor on select", () => {
    render(
      <Menu open>
        <MenuTrigger>trigger</MenuTrigger>
        <MenuContent>
          <CopyToApp action={action} />
        </MenuContent>
      </Menu>,
    );

    fireEvent.click(screen.getByText("Copy to application"));

    expect(mockDispatch).toHaveBeenCalledWith(
      openCopyToAppModal({
        entityType: CopyToAppEntityType.ACTION,
        entityId: "action-1",
        entityName: "Query1",
        sourcePageId: "page-1",
      }),
    );
  });
});
