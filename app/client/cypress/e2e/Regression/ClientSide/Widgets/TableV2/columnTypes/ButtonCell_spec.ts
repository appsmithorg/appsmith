import {
  agHelper,
  entityExplorer,
  propPane,
  table,
} from "../../../../../../support/Objects/ObjectsCore";

describe(
  "Table Widget V2 Button cell tests",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  () => {
    const tableDataSelector = (row: number, col: number) =>
      table.GetTableDataSelector(row, col) + " div";

    before(() => {
      entityExplorer.DragDropWidgetNVerify("tablewidgetv2", 650, 250);
      propPane.EnterJSContext("Table data", JSON.stringify([{ button: true }]));
    });

    const validateAlignment = (
      alignment: string,
      expectedValue: string,
      isHorizontal: boolean,
    ) => {
      const property = isHorizontal
        ? "Horizontal Alignment"
        : "Vertical alignment";
      propPane.ToggleJSMode(property, true);
      propPane.UpdatePropertyFieldValue(property, alignment);
      const cssProperty = isHorizontal ? "justify-content" : "align-items";
      agHelper
        .GetElement(tableDataSelector(0, 0))
        .should("have.css", cssProperty, expectedValue);
    };

    it("1. Test to validate horizontal and vertical alignments", function () {
      table.ChangeColumnType("button", "Button");
      propPane.MoveToTab("Style");

      // Horizontal alignments
      const horizontalAlignments = [
        { alignment: "CENTER", expected: "center" },
        { alignment: "RIGHT", expected: "flex-end" },
        { alignment: "LEFT", expected: "flex-start" },
      ];
      horizontalAlignments.forEach(({ alignment, expected }) => {
        validateAlignment(alignment, expected, true);
      });

      // Vertical alignments
      const verticalAlignments = [
        { alignment: "TOP", expected: "flex-start" },
        { alignment: "BOTTOM", expected: "flex-end" },
        { alignment: "CENTER", expected: "center" },
      ];
      verticalAlignments.forEach(({ alignment, expected }) => {
        validateAlignment(alignment, expected, false);
      });
    });
  },
);
