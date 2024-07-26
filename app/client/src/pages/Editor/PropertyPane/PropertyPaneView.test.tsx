import React from "react";
import { getActions } from "./PropertyPaneView"; 

describe("getActions", () => {
  const mockOnCopy = jest.fn();
  const mockOnDelete = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return an empty array when widget type is CONTAINER_WIDGET", () => {
    const widgetProperties = { type: "CONTAINER_WIDGET" };
    const actions = getActions(widgetProperties, mockOnCopy, mockOnDelete);
    expect(actions).toEqual([]);
  });

  it("should returns actions array when widget type is not CONTAINER_WIDGET", () => {
    const widgetProperties = { type: "LIST_WIDGET_V2" };
    const actions = getActions(widgetProperties, mockOnCopy, mockOnDelete);
    expect(actions).toHaveLength(2); 
  });
});
