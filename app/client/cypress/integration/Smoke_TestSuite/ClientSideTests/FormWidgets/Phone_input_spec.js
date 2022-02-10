const dsl = require("../../../../fixtures/emptyDSL.json");
const explorer = require("../../../../locators/explorerlocators.json");

const widgetName = "phoneinputwidget";
const widgetInput = `.t--widget-${widgetName} input`;

describe("Phone input widget - ", () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Add new dropdown widget", () => {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas(widgetName, { x: 300, y: 300 });
    cy.get(`.t--widget-${widgetName}`).should("exist");
    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 500 });
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(
      ".t--property-control-text",
      `{{PhoneInput1.text}}:{{PhoneInput1.countryCode}}:{{PhoneInput1.dialCode}}`,
    );
  });

  it("should check for the format and dialCode", () => {
    cy.get(`.t--widget-${widgetName} input`).clear();
    cy.wait(300);
    cy.get(`.t--widget-${widgetName} input`).type("9999999999");
    cy.get(".t--widget-textwidget").should("contain", "(999) 999-9999:US:+1");

    cy.openPropertyPane(widgetName);
    cy.selectDropdownValue(
      ".t--property-control-defaultcountrycode",
      "Afghanistan (+93)",
    );
    cy.get(`.t--widget-${widgetName} input`).clear();
    cy.wait(300);
    cy.get(`.t--widget-${widgetName} input`).type("1111111111");
    cy.get(".t--widget-textwidget").should("contain", "1111111111:AF:+93");
    cy.get(".t--input-country-code-change").should("contain", "🇦🇫+93");

    cy.get(".t--property-control-allowcountrycodechange label")
      .last()
      .click({ force: true });
    cy.get(".t--input-country-code-change")
      .first()
      .click();
    cy.get(".t--search-input input").type("+91");
    cy.wait(500);
    cy.get(".t--dropdown-option")
      .last()
      .click();
    cy.get(`.t--widget-${widgetName} input`).clear();
    cy.wait(300);
    cy.get(`.t--widget-${widgetName} input`).type("9999999999");
    cy.get(".t--widget-textwidget").should("contain", "99999 99999:IN:+91");
    cy.get(".t--input-country-code-change").should("contain", "🇮🇳+91");
  });

  it("should check that widget input resets on submit", () => {
    cy.openPropertyPane(widgetName);
    cy.get(
      ".t--property-control-onsubmit .t--open-dropdown-Select-Action",
    ).click();
    cy.selectShowMsg();
    cy.addSuccessMessage("Submitted!!");

    cy.get(widgetInput).clear();
    cy.wait(300);
    cy.get(widgetInput).type("1234567890{enter}");
    cy.wait(300);
    cy.get(widgetInput).should("contain.value", "");
  });

  describe("Label section", () => {
    it("Check properties: Text, Position, Alignment, Width", () => {
      const labelText = "Name";
      const parentColumnSpace = 11.9375;
      const widgetSelector = `.t--widget-${widgetName}`;
      const labelSelector = `${widgetSelector} label`;
      const containerSelector = `${widgetSelector} [class*="InputComponentWrapper"]`;
      const labelPositionSelector = ".t--property-control-position button";
      const labelAlignmentSelector = ".t--property-control-alignment button";
      const labelWidthSelector =
        ".t--property-control-width .CodeMirror textarea";

      cy.openPropertyPane(widgetName);

      cy.get(".t--property-control-text .CodeMirror textarea")
        .first()
        .focus()
        .type(labelText);
      // Assert label presence
      cy.get(labelSelector)
        .first()
        .contains(labelText);
      // Assert label position: Auto
      cy.get(containerSelector).should("have.css", "flex-direction", "row");
      // Change label position to Top
      cy.get(labelPositionSelector)
        .eq(1)
        .click();
      // Assert label position: Top
      cy.get(containerSelector).should("have.css", "flex-direction", "column");
      // Change label position to Left
      cy.get(labelPositionSelector)
        .eq(2)
        .click();
      cy.wait(300);
      // Set label alignment to RIGHT
      cy.get(labelAlignmentSelector)
        .eq(1)
        .click();
      // Assert label alignment
      cy.get(labelSelector)
        .first()
        .should("have.css", "text-align", "right");
      // Set label width to 4 cols
      cy.get(labelWidthSelector)
        .first()
        .focus()
        .type("4");
      cy.wait(300);
      // Assert label width
      cy.get(labelSelector)
        .first()
        .should("have.css", "width", `${parentColumnSpace * 4}px`);
    });
  });
});
