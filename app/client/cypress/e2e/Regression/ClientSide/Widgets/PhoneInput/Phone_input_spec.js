import * as _ from "../../../../../support/Objects/ObjectsCore";

const widgetName = "phoneinputwidget";
const widgetInput = `.t--widget-${widgetName} input`;
const searchAndSelectOption = (optionValue) => {
  cy.get(".t--property-control-defaultcountrycode input")
    .last()
    .scrollIntoView()
    .click({ force: true })
    .type(optionValue.substring(0, 3));
  cy.get(".t--dropdown-option")
    .children()
    .contains(optionValue)
    .click({ force: true });
};
describe(
  "Phone input widget - ",
  { tags: ["@tag.All", "@tag.PhoneInput", "@tag.Binding"] },
  () => {
    before(() => {
      _.agHelper.AddDsl("emptyDSL");
    });

    it("1. Add new dropdown widget", () => {
      cy.dragAndDropToCanvas(widgetName, { x: 300, y: 300 });
      cy.get(`.t--widget-${widgetName}`).should("exist");
      cy.dragAndDropToCanvas("textwidget", { x: 300, y: 500 });
      cy.openPropertyPane("textwidget");
      cy.updateCodeInput(
        ".t--property-control-text",
        `{{PhoneInput1.text}}:{{PhoneInput1.countryCode}}:{{PhoneInput1.dialCode}}`,
      );
    });

    it("2. Should check for the format and dialCode", () => {
      cy.get(`.t--widget-${widgetName} input`).clear();
      cy.wait(500);
      cy.get(`.t--widget-${widgetName} input`).type("9999999999");
      cy.get(".t--widget-textwidget").should("contain", "(999) 999-9999:US:+1");

      cy.openPropertyPane(widgetName);
      searchAndSelectOption("Afghanistan (+93)");
      cy.get(`.t--widget-${widgetName} input`).clear();
      cy.wait(500);
      cy.get(`.t--widget-${widgetName} input`).type("1234567890");
      cy.get(".t--widget-textwidget").should("contain", "1234567890:AF:+93");
      cy.get(".t--input-country-code-change").should("contain", "🇦🇫+93");

      cy.get(".t--property-control-changecountrycode label")
        .last()
        .click({ force: true });
      cy.get(".t--input-country-code-change").first().click();
      cy.get(".t--search-input input").type("+91");
      cy.wait(500);
      cy.get("[data-cy='t--dropdown-option-India (+91)").last().click();
      cy.get(`.t--widget-${widgetName} input`).clear();
      cy.wait(500);
      cy.get(`.t--widget-${widgetName} input`).type("9999999999");
      cy.get(".t--widget-textwidget").should("contain", "99999 99999:IN:+91");
      cy.get(".t--input-country-code-change").should("contain", "🇮🇳+91");

      cy.get(".t--property-control-enableformatting label")
        .last()
        .click({ force: true });
      searchAndSelectOption("United States / Canada (+1)");
      cy.get(`.t--widget-${widgetName} input`).clear();
      cy.wait(500);
      cy.get(`.t--widget-${widgetName} input`).type("9999999999");
      cy.get(".t--widget-textwidget").should("contain", "9999999999:US:+1");

      cy.openPropertyPane(widgetName);
      searchAndSelectOption("India (+91)");
      cy.get(`.t--widget-${widgetName} input`).clear();
      cy.wait(500);
      cy.get(`.t--widget-${widgetName} input`).type("1234567890");
      cy.get(".t--widget-textwidget").should("contain", "1234567890:IN:+91");
      cy.get(".t--input-country-code-change").should("contain", "🇮🇳+91");
    });

    it("3. Should check that widget input resets on submit", () => {
      cy.openPropertyPane("textwidget");
      cy.updateCodeInput(
        ".t--property-control-text",
        `{{PhoneInput1.text}}:{{PhoneInput1.value}}`,
      );
      cy.openPropertyPane(widgetName);
      cy.getAlert("onSubmit", "Submitted!!");

      cy.get(widgetInput).clear();
      cy.wait(500);
      cy.get(widgetInput).click().type("1234567890");
      cy.wait(500);
      cy.get(".t--widget-textwidget").should(
        "contain",
        "1234567890:1234567890",
      );
      cy.get(widgetInput).type("{enter}");
      cy.wait(300);
      cy.get(widgetInput).should("contain.value", "");
      cy.get(".t--widget-textwidget").should("contain", ":");
    });

    it("4. Check isDirty meta property", function () {
      cy.openPropertyPane("textwidget");
      cy.updateCodeInput(
        ".t--property-control-text",
        `{{PhoneInput1.isDirty}}`,
      );
      // Change defaultText
      cy.openPropertyPane(widgetName);
      cy.updateCodeInput(".t--property-control-defaultvalue", "1");
      cy.closePropertyPane();
      // Check if isDirty is set to false
      cy.get(".t--widget-textwidget").should("contain", "false");
      // Interact with UI
      cy.get(widgetInput).clear();
      cy.wait(300);
      cy.get(widgetInput).type("2");
      cy.wait(300);
      // Check if isDirty is set to true
      cy.get(".t--widget-textwidget").should("contain", "true");
      // Reset isDirty by changing defaultText
      cy.openPropertyPane(widgetName);
      cy.updateCodeInput(".t--property-control-defaultvalue", "3");
      // Check if isDirty is set to false
      cy.get(".t--widget-textwidget").should("contain", "false");
    });

    it("5. Currency change dropdown should not close unexpectedly", function () {
      cy.openPropertyPane(widgetName);

      // Select the Currency dropdown option from property pane
      // and enter a value that has space and returns 0 results
      cy.get(".t--property-control-defaultcountrycode input")
        .first()
        .click()
        .type("AFDB (+93)");

      // assert that the dropdown is still option
      cy.get(".t--property-control-defaultcountrycode input").should(
        "be.visible",
      );
    });
  },
);
