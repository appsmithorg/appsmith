import type { TableWidgetProps } from "../../constants";
import {
  updateAllowAddNewRowOnInfiniteScrollChange,
  updateCellEditabilityOnInfiniteScrollChange,
  updateSearchSortFilterOnInfiniteScrollChange,
} from "../propertyUtils";

// Tests for infinite scroll update hooks
describe("Infinite Scroll Update Hooks - ", () => {
  it("updateAllowAddNewRowOnInfiniteScrollChange - should disable/enable add new row when infinite scroll is toggled", () => {
    const props = {} as TableWidgetProps;

    // When infinite scroll is enabled
    expect(
      updateAllowAddNewRowOnInfiniteScrollChange(
        props,
        "infiniteScrollEnabled",
        true,
      ),
    ).toEqual([
      {
        propertyPath: "allowAddNewRow",
        propertyValue: false,
      },
    ]);

    // When infinite scroll is disabled
    expect(
      updateAllowAddNewRowOnInfiniteScrollChange(
        props,
        "infiniteScrollEnabled",
        false,
      ),
    ).toEqual([
      {
        propertyPath: "allowAddNewRow",
        propertyValue: true,
      },
    ]);

    // When some other value is passed
    expect(
      updateAllowAddNewRowOnInfiniteScrollChange(
        props,
        "infiniteScrollEnabled",
        "some-other-value",
      ),
    ).toBeUndefined();
  });

  it("updateSearchSortFilterOnInfiniteScrollChange - should disable/enable search, filter, sort when infinite scroll is toggled", () => {
    const props = {} as TableWidgetProps;

    // When infinite scroll is enabled
    expect(
      updateSearchSortFilterOnInfiniteScrollChange(
        props,
        "infiniteScrollEnabled",
        true,
      ),
    ).toEqual([
      {
        propertyPath: "isVisibleSearch",
        propertyValue: false,
      },
      {
        propertyPath: "isVisibleFilters",
        propertyValue: false,
      },
      {
        propertyPath: "isSortable",
        propertyValue: false,
      },
    ]);

    // When infinite scroll is disabled
    expect(
      updateSearchSortFilterOnInfiniteScrollChange(
        props,
        "infiniteScrollEnabled",
        false,
      ),
    ).toEqual([
      {
        propertyPath: "isVisibleFilters",
        propertyValue: true,
      },
      {
        propertyPath: "isVisibleSearch",
        propertyValue: true,
      },
      {
        propertyPath: "isSortable",
        propertyValue: true,
      },
    ]);

    // When some other value is passed
    expect(
      updateSearchSortFilterOnInfiniteScrollChange(
        props,
        "infiniteScrollEnabled",
        "some-other-value",
      ),
    ).toBeUndefined();
  });

  it("updateCellEditabilityOnInfiniteScrollChange - should disable cell editability when infinite scroll is enabled", () => {
    // Setup mock primary columns
    const props = {
      primaryColumns: {
        column1: {
          id: "column1",
          alias: "column1",
          isEditable: true,
          isCellEditable: true,
        },
        column2: {
          id: "column2",
          alias: "column2",
          isEditable: true,
          isCellEditable: true,
        },
      },
    } as unknown as TableWidgetProps;

    // When infinite scroll is enabled
    expect(
      updateCellEditabilityOnInfiniteScrollChange(
        props,
        "infiniteScrollEnabled",
        true,
      ),
    ).toEqual([
      {
        propertyPath: "primaryColumns.column1.isCellEditable",
        propertyValue: false,
      },
      {
        propertyPath: "primaryColumns.column1.isEditable",
        propertyValue: false,
      },
      {
        propertyPath: "primaryColumns.column2.isCellEditable",
        propertyValue: false,
      },
      {
        propertyPath: "primaryColumns.column2.isEditable",
        propertyValue: false,
      },
    ]);

    // When infinite scroll is disabled
    expect(
      updateCellEditabilityOnInfiniteScrollChange(
        props,
        "infiniteScrollEnabled",
        false,
      ),
    ).toEqual([
      {
        propertyPath: "primaryColumns.column1.isCellEditable",
        propertyValue: true,
      },
      {
        propertyPath: "primaryColumns.column1.isEditable",
        propertyValue: true,
      },
      {
        propertyPath: "primaryColumns.column2.isCellEditable",
        propertyValue: true,
      },
      {
        propertyPath: "primaryColumns.column2.isEditable",
        propertyValue: true,
      },
    ]);

    // Test with no primary columns
    const propsWithoutColumns = {} as TableWidgetProps;
    expect(
      updateCellEditabilityOnInfiniteScrollChange(
        propsWithoutColumns,
        "infiniteScrollEnabled",
        true,
      ),
    ).toBeUndefined();

    // When some other value is passed
    expect(
      updateCellEditabilityOnInfiniteScrollChange(
        props,
        "infiniteScrollEnabled",
        "some-other-value",
      ),
    ).toBeUndefined();
  });
});
