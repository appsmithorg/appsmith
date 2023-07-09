const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import { agHelper } from "../../../../../support/Objects/ObjectsCore";

describe("Table widget inline editing functionality", () => {
  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
    agHelper.AddDsl("Table/InlineEditingDSL");
  });

  let propPaneBack = "[data-testid='t--property-pane-back-btn']";

  it("1. should check that edit check box is present in the columns list", () => {
    cy.openPropertyPane("tablewidgetv2");

    ["step", "task", "status", "action"].forEach((column) => {
      cy.get(
        `[data-rbd-draggable-id="${column}"] .t--card-checkbox input[type="checkbox"]`,
      ).should("exist");
    });
  });

  it("2. should check that editablity checkbox is preset top of the list", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.get(`.t--property-control-columns .t--uber-editable-checkbox`).should(
      "exist",
    );
  });

  it("3. should check that turning on editablity turns on edit in all the editable column in the list", () => {
    cy.openPropertyPane("tablewidgetv2");
    function checkEditableCheckbox(expected) {
      ["step", "task", "status"].forEach((column) => {
        cy.get(
          `[data-rbd-draggable-id="${column}"] .t--card-checkbox.t--checked`,
        ).should(expected);
      });
    }

    checkEditableCheckbox("not.exist");

    cy.get(
      `.t--property-control-columns .t--uber-editable-checkbox input+span`,
    ).click();

    checkEditableCheckbox("exist");

    cy.get(
      `.t--property-control-columns .t--uber-editable-checkbox input+span`,
    ).click();

    checkEditableCheckbox("not.exist");
  });

  it("4. should check that turning on editablity DOESN'T turn on edit in the non editable column in the list", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.get(
      '[data-rbd-draggable-id="action"] .t--card-checkbox.t--checked',
    ).should("not.exist");
    cy.get(
      `.t--property-control-columns .t--uber-editable-checkbox input+span`,
    ).click();
    cy.get(
      '[data-rbd-draggable-id="action"] .t--card-checkbox.t--checked',
    ).should("not.exist");
    cy.get(
      `.t--property-control-columns .t--uber-editable-checkbox input+span`,
    ).click();
    cy.get(
      '[data-rbd-draggable-id="action"] .t--card-checkbox.t--checked',
    ).should("not.exist");
  });

  it("5. should check that checkbox in the column list and checkbox inside the column settings ARE in sync", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.get(
      '[data-rbd-draggable-id="step"] .t--card-checkbox.t--checked',
    ).should("not.exist");
    cy.editColumn("step");
    cy.get(".t--property-control-editable .ads-v2-switch.checked").should(
      "not.exist",
    );
    cy.get(propPaneBack).click();
    cy.get(
      '[data-rbd-draggable-id="step"] .t--card-checkbox input+span',
    ).click();
    cy.get(
      '[data-rbd-draggable-id="step"] .t--card-checkbox.t--checked',
    ).should("exist");
    cy.editColumn("step");
    cy.get(".t--property-control-editable")
      .find("input")
      .should("have.attr", "checked");
    cy.get(propPaneBack).click();
    cy.get(
      '[data-rbd-draggable-id="step"] .t--card-checkbox input+span',
    ).click();
    cy.get(
      '[data-rbd-draggable-id="step"] .t--card-checkbox.t--checked',
    ).should("not.exist");
    cy.editColumn("step");
    cy.get(".t--property-control-editable .ads-v2-switch.checked").should(
      "not.exist",
    );
  });

  it("6. should check that checkbox in the column list and checkbox inside the column settings ARE NOT in sync when there is js expression", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("step");
    cy.get(".t--property-control-editable .t--js-toggle").click();
    cy.updateCodeInput(".t--property-control-editable", `{{true === true}}`);
    cy.get(propPaneBack).click();
    cy.makeColumnEditable("step");
    cy.editColumn("step");
    cy.get(".t--property-control-editable .CodeMirror .CodeMirror-code").should(
      "contain",
      "{{true === true}}",
    );
    cy.get(propPaneBack).click();
    cy.makeColumnEditable("step");
    cy.editColumn("step");
    cy.get(".t--property-control-editable .CodeMirror .CodeMirror-code").should(
      "contain",
      "{{true === true}}",
    );
  });

  it("7. should check that editable checkbox is disabled for columns that are not editable", () => {
    cy.openPropertyPane("tablewidgetv2");
    [
      {
        columnType: "URL",
        expected: "be.disabled",
      },
      {
        columnType: "Number",
        expected: "not.be.disabled",
      },
      {
        columnType: "Date",
        expected: "not.be.disabled",
      },
      {
        columnType: "Image",
        expected: "be.disabled",
      },
      {
        columnType: "Video",
        expected: "be.disabled",
      },
      {
        columnType: "Button",
        expected: "be.disabled",
      },
      {
        columnType: "Menu button",
        expected: "be.disabled",
      },
      {
        columnType: "Icon button",
        expected: "be.disabled",
      },
      {
        columnType: "Plain text",
        expected: "not.be.disabled",
      },
    ].forEach((data) => {
      cy.editColumn("step");
      cy.get(commonlocators.changeColType).last().click();
      cy.get(".t--dropdown-option")
        .children()
        .contains(data.columnType)
        .click();
      cy.wait("@updateLayout");
      cy.get(propPaneBack).click();
      cy.get(`[data-rbd-draggable-id="step"] .t--card-checkbox input`).should(
        data.expected,
      );
    });
  });

  it("8. should check that editable property is only available for Plain text & number columns", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("step");
    [
      {
        columnType: "URL",
        expected: "not.exist",
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
        columnType: "Menu button",
        expected: "not.exist",
      },
      {
        columnType: "Icon button",
        expected: "not.exist",
      },
      {
        columnType: "Plain text",
        expected: "exist",
      },
    ].forEach((data) => {
      cy.get(commonlocators.changeColType).last().click();
      cy.get(".t--dropdown-option")
        .children()
        .contains(data.columnType)
        .click();
      cy.wait("@updateLayout");
      cy.get(".t--property-control-editable").should(data.expected);
    });
  });

  it("9. should check that inline save option is shown only when a column is made editable", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.get(".t--property-control-updatemode").should("not.exist");
    cy.makeColumnEditable("step");
    cy.get(".t--property-control-updatemode").should("exist");
    cy.makeColumnEditable("step");
    cy.get(".t--property-control-updatemode").should("exist");

    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 600 });
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(
      ".t--property-control-text",
      `{{Table1.inlineEditingSaveOption}}`,
    );
    cy.get(".t--widget-textwidget .bp3-ui-text").should("contain", "ROW_LEVEL");
  });

  it("10. should check that save/discard column is added when a column is made editable and removed when made uneditable", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.makeColumnEditable("step");
    cy.get("[data-rbd-draggable-id='EditActions1']").should("exist");
    cy.get("[data-rbd-draggable-id='EditActions1'] input[type='text']").should(
      "contain.value",
      "Save / Discard",
    );
    cy.get("[data-colindex='4'][data-rowindex='0'] button").should(
      "be.disabled",
    );
    cy.makeColumnEditable("step");
    cy.get("[data-rbd-draggable-id='EditActions1']").should("not.exist");

    cy.get(
      `.t--property-control-columns .t--uber-editable-checkbox input+span`,
    ).click();
    cy.get("[data-rbd-draggable-id='EditActions1']").should("exist");
    cy.get("[data-rbd-draggable-id='EditActions1'] input[type='text']").should(
      "contain.value",
      "Save / Discard",
    );
    cy.get("[data-colindex='4'][data-rowindex='0'] button").should(
      "be.disabled",
    );
    cy.get(
      `.t--property-control-columns .t--uber-editable-checkbox input+span`,
    ).click();
    cy.get("[data-rbd-draggable-id='EditActions1']").should("not.exist");

    cy.editColumn("step");
    cy.get(".t--property-control-editable .ads-v2-switch").click();
    cy.get(propPaneBack).click();
    cy.get("[data-rbd-draggable-id='EditActions1']").should("exist");
    cy.get("[data-rbd-draggable-id='EditActions1'] input[type='text']").should(
      "contain.value",
      "Save / Discard",
    );
    cy.get("[data-colindex='4'][data-rowindex='0'] button").should(
      "be.disabled",
    );
    cy.editColumn("step");
    cy.get(".t--property-control-editable .ads-v2-switch").click();
    cy.get("[data-rbd-draggable-id='EditActions1']").should("not.exist");
  });
});
