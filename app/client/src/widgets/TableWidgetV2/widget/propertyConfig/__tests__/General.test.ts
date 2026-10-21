import General from "../PanelConfig/General";
import { ColumnTypes } from "widgets/TableWidgetV2/constants";
import type { TableWidgetProps } from "widgets/TableWidgetV2/constants";

describe("TableWidgetV2 column General config", () => {
  it("shows header wrapping for every column and leaves cell wrapping type-limited", () => {
    const properties = General.children as Array<{
      propertyName: string;
      label?: string;
      defaultValue?: boolean;
      isJSConvertible?: boolean;
      hidden?: (props: TableWidgetProps, propertyPath: string) => boolean;
    }>;
    const names = properties.map((property) => property.propertyName);
    const headerWrapping = properties.find(
      (property) => property.propertyName === "allowHeaderWrapping",
    );
    const cellWrapping = properties.find(
      (property) => property.propertyName === "allowCellWrapping",
    );

    expect(names.indexOf("allowHeaderWrapping")).toBe(
      names.indexOf("allowCellWrapping") + 1,
    );
    expect(headerWrapping).toEqual(
      expect.objectContaining({
        label: "Header wrapping",
        defaultValue: false,
        controlType: "SWITCH",
      }),
    );
    expect(headerWrapping?.isJSConvertible).toBeUndefined();
    expect(headerWrapping?.hidden).toBeUndefined();
    expect(cellWrapping?.hidden).toEqual(expect.any(Function));
    expect(
      cellWrapping?.hidden?.(
        {
          primaryColumns: {
            button: { columnType: ColumnTypes.BUTTON },
          },
        } as unknown as TableWidgetProps,
        "primaryColumns.button.allowCellWrapping",
      ),
    ).toBe(true);
  });
});
