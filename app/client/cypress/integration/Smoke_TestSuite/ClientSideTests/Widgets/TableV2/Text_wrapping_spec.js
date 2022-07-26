const dsl = require("../../../../../fixtures/Table/TextWrappingDSL.json");
const commonlocators = require("../../../../../locators/commonlocators.json");

describe("Table Widget text wrapping functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("1. should check that cell is not wrapped when cell wrapping is disabled", () => {
    cy.getTableCellHeight(1, 0).then((height) => {
      expect(height).to.equal("28px");
    });

    // Enable cell wrapping and check that height is more than 28px
    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("image");
    cy.get(".t--property-control-cellwrapping .bp3-control-indicator")
      .first()
      .click();

    cy.getTableCellHeight(1, 0).then((height) => {
      expect(height).to.not.equal("28px");
    });
  });

  it("2. should check that other cells in the row is not wrapped when one of the cell is wrapped", () => {
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
    cy.get(".t--property-control-cellwrapping .bp3-control-indicator")
      .first()
      .click();
    cy.getTableCellHeight(2, 0).then((height) => {
      expect(height).to.not.equal("28px");
    });
  });

  it("3. should check that cell wrapping option is only available for plain text, number, date and URL", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("email");
    [
      {
        columnType: "URL",
        expected: "exist",
      },
      {
        columnType: "Plain Text",
        expected: "exist",
      },
      {
        columnType: "Number",
        expected: "exist",
      },
      {
        columnType: "Date",
        expected: "exist",
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
        columnType: "Menu Button",
        expected: "not.exist",
      },
      {
        columnType: "Icon Button",
        expected: "not.exist",
      },
    ].forEach((data, i) => {
      cy.get(commonlocators.changeColType)
        .last()
        .click();
      cy.get(".t--dropdown-option")
        .children()
        .contains(data.columnType)
        .click();
      cy.wait("@updateLayout");
      cy.get(".t--property-control-cellwrapping").should(data.expected);
    });
  });

  it("4. should check that plain text, number, date and URL column is getting wrapped when cell wrapping is enabled", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("id");

    ["URL", "Number", "Date", "Plain Text"].forEach((data, i) => {
      cy.get(commonlocators.changeColType)
        .last()
        .click();
      cy.get(".t--dropdown-option")
        .children()
        .contains(data)
        .click();
      cy.wait("@updateLayout");
      cy.getTableCellHeight(0, 0).then((height) => {
        expect(height).to.equal("28px");
      });
      cy.get(".t--property-control-cellwrapping .bp3-control-indicator")
        .first()
        .click();
      cy.wait(1000);
      cy.getTableCellHeight(0, 0).then((height) => {
        expect(height).to.not.equal("28px");
      });
      cy.get(".t--property-control-cellwrapping .bp3-control-indicator")
        .first()
        .click();
    });
  });

  it("5. should check that pageSize does not change when cell wrapping is enabled", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("image");
    let pageSizeBeforeWrapping;
    cy.get(".t--widget-textwidget .bp3-ui-text")
      .invoke("text")
      .then((value) => {
        pageSizeBeforeWrapping = value;
      });
    cy.get(".t--property-control-cellwrapping .bp3-control-indicator")
      .first()
      .click();
    cy.wait(1000);
    cy.get(".t--widget-textwidget .bp3-ui-text")
      .invoke("text")
      .then((value) => {
        expect(pageSizeBeforeWrapping).to.equal(value);
      });
  });
});
