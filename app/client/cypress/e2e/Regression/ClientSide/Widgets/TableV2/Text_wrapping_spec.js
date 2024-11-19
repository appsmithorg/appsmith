const commonlocators = require("../../../../../locators/commonlocators.json");
import { agHelper, propPane } from "../../../../../support/Objects/ObjectsCore";

describe(
  "Table Widget text wrapping functionality",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    afterEach(() => {
      agHelper.SaveLocalStorageCache();
    });

    beforeEach(() => {
      agHelper.RestoreLocalStorageCache();
      agHelper.AddDsl("Table/TextWrappingDSL");
    });

    it("1. should check that cell is not wrapped when cell wrapping is disabled", () => {
      cy.getTableCellHeight(1, 0).then((height) => {
        expect(height).to.equal("28px");
      });

      // Enable cell wrapping and check that height is more than 28px
      cy.openPropertyPane("tablewidgetv2");
      cy.editColumn("image");

      propPane.TogglePropertyState("Cell wrapping", "On");
      cy.getTableCellHeight(1, 0).then((height) => {
        expect(height).to.not.equal("28px");
      });
    });

    it("2. should check that a tooltip is shown when hovered on a ellipsised content", () => {
      cy.get(
        `.td[data-colindex=2][data-rowindex=0] .t--table-cell-tooltip-target`,
      ).trigger("mouseenter");

      cy.get(".bp3-tooltip").should("exist");
      cy.get(".bp3-tooltip .bp3-popover-content").should(
        "contain",
        "michael.lawson@reqres.in",
      );

      cy.get(
        `.td[data-colindex=2][data-rowindex=1] .t--table-cell-tooltip-target`,
      ).trigger("mouseenter", { force: true });

      cy.get(".bp3-tooltip").should("exist");
      cy.get(".bp3-tooltip .bp3-popover-content").should(
        "contain",
        "lindsay.ferguson@reqres.in",
      );
    });

    it("3. should check that other cells in the row is not wrapped when one of the cell is wrapped", () => {
      cy.getTableCellHeight(2, 0).then((height) => {
        expect(height).to.equal("28px");
      });

      cy.getTableCellHeight(3, 0).then((height) => {
        expect(height).to.equal("28px");
      });

      // Enable cell wrapping and check that height is more than 28px
      cy.openPropertyPane("tablewidgetv2");
      cy.wait(2000);
      cy.editColumn("email");

      propPane.TogglePropertyState("Cell wrapping", "On");
      cy.getTableCellHeight(2, 0).then((height) => {
        expect(height).to.not.equal("28px");
      });
    });

    it("4. should check that cell wrapping option is only available for plain text, number and URL", () => {
      cy.openPropertyPane("tablewidgetv2");
      cy.editColumn("email");
      [
        {
          columnType: "URL",
          expected: "exist",
        },
        {
          columnType: "Plain text",
          expected: "exist",
        },
        {
          columnType: "Number",
          expected: "exist",
        },
        {
          columnType: "Date",
          expected: "not.exist",
        },
        {
          columnType: "Image",
          expected: "not.exist",
        },
        {
          columnType: "Video",
          expected: "not.exist",
        },
        {
          columnType: "Button",
          expected: "not.exist",
        },
        {
          columnType: "Menu button",
          expected: "not.exist",
        },
        {
          columnType: "Icon button",
          expected: "not.exist",
        },
      ].forEach((data, i) => {
        cy.get(commonlocators.changeColType).last().click();
        cy.get(".t--dropdown-option")
          .children()
          .contains(data.columnType)
          .click({ force: true });
        cy.wait("@updateLayout");
        cy.get(".t--property-control-cellwrapping").should(data.expected);
      });
    });

    it("5. should check that plain text, number and URL column is getting wrapped when cell wrapping is enabled", () => {
      cy.openPropertyPane("tablewidgetv2");
      cy.editColumn("id");

      ["URL", "Number", "Plain text"].forEach((data, i) => {
        cy.get(commonlocators.changeColType).last().click();
        cy.get(".t--dropdown-option").children().contains(data).click();
        cy.wait("@updateLayout");
        cy.getTableCellHeight(0, 0).then((height) => {
          expect(height).to.equal("28px");
        });
        propPane.TogglePropertyState("Cell wrapping", "On");
        cy.wait(1000);
        cy.getTableCellHeight(0, 0).then((height) => {
          expect(height).to.not.equal("28px");
        });
        propPane.TogglePropertyState("Cell wrapping", "Off");
      });
    });

    it("6. should check that pageSize does not change when cell wrapping is enabled", () => {
      cy.openPropertyPane("tablewidgetv2");
      cy.editColumn("image");
      let pageSizeBeforeWrapping;
      cy.get(".t--widget-textwidget .bp3-ui-text")
        .invoke("text")
        .then((value) => {
          pageSizeBeforeWrapping = value;
        });
      propPane.TogglePropertyState("Cell wrapping", "On");
      cy.get(".t--widget-textwidget .bp3-ui-text")
        .invoke("text")
        .then((value) => {
          expect(pageSizeBeforeWrapping).to.equal(value);
        });
    });
  },
);
