import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import { Menu, MenuContent, MenuTrigger } from "@appsmith/ads";
import type { JSCollection } from "entities/JSCollection";
import { CopyToApp } from "./CopyToApp";
import { openCopyToAppModal } from "actions/copyToAppActions";
import { CopyToAppEntityType } from "pages/Editor/Explorer/CopyToApp/types";

const mockDispatch = jest.fn();

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

const jsAction = {
  id: "js-1",
  name: "JSObject1",
  pageId: "page-1",
} as unknown as JSCollection;

describe("CopyToApp JS menu item", () => {
  beforeEach(() => mockDispatch.mockClear());

  it("dispatches openCopyToAppModal with the JS-object descriptor on select", () => {
    render(
      <Menu open>
        <MenuTrigger>trigger</MenuTrigger>
        <MenuContent>
          <CopyToApp jsAction={jsAction} />
        </MenuContent>
      </Menu>,
    );

    fireEvent.click(screen.getByText("Copy to application"));

    expect(mockDispatch).toHaveBeenCalledWith(
      openCopyToAppModal({
        entityType: CopyToAppEntityType.JS_OBJECT,
        entityId: "js-1",
        entityName: "JSObject1",
        sourcePageId: "page-1",
      }),
    );
  });
});
