const commonlocators = require("../../../../../locators/commonlocators.json");
const themeLocator = require("../../../../../locators/ThemeLocators.json");
const dsl = require("../../../../../fixtures/filePickerV2WidgetReskinDsl.json");

describe("Checkbox Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Elements inside upload modal should follow theme border radius", () => {
    // Click on canvas to get global theme settings
    cy.get(commonlocators.canvas).click({ force: true });

    cy.get(commonlocators.themeAppBorderRadiusBtn)
      .last()
      .click();

    cy.get(commonlocators.filepickerv2).click();

    // Check the border radius of the modal:
    cy.get(".uppy-Dashboard-inner").should("have.css", "border-radius", "24px");
    cy.get(".uppy-Dashboard-innerWrap").should(
      "have.css",
      "border-radius",
      "24px",
    );
    cy.get(".uppy-Dashboard-AddFiles").should(
      "have.css",
      "border-radius",
      "24px",
    );

    // Check the border radius of close button top right
    cy.get(".uppy-Dashboard-close").should("have.css", "border-radius", "24px");

    cy.get(commonlocators.filePickerInput)
      .first()
      .attachFile("testFile.mov");
    cy.get(".uppy-StatusBar-actionBtn--upload").should(
      "have.css",
      "border-radius",
      "24px",
    );

    // Check the border radius of the remove file icon
    cy.get(".uppy-Dashboard-Item-action--remove .uppy-c-icon").should(
      "have.css",
      "border-radius",
      "24px",
    );

    cy.get(".uppy-Dashboard-close").click({ force: true });
    cy.wait(300);

    // Change the theme border radius to M and check if the remove file icon's border radius is 4px;
    cy.get(commonlocators.canvas).click({ force: true });
    cy.get(commonlocators.themeAppBorderRadiusBtn)
      .eq(1)
      .click();

    cy.get(commonlocators.filepickerv2).click();

    // Again Check the border radius of the remove file icon
    cy.get(".uppy-Dashboard-Item-action--remove .uppy-c-icon").should(
      "have.css",
      "border-radius",
      "4px",
    );
  });

  it("2. Check colors inside the modal", () => {
    cy.get(".uppy-Dashboard-close").click({ force: true });
    cy.wait(300);

    // Change the global theme primary color
    cy.get(commonlocators.canvas).click({ force: true });
    cy.wait(300);

    cy.get(themeLocator.inputColor).click({ force: true });
    cy.get(".t--colorpicker-v2-color")
      .eq(9)
      .click({ force: true })
      .then(($elem) => {
        const primaryColor = $elem.css("background-color");
        cy.get(commonlocators.filepickerv2).click();
        cy.get(".uppy-StatusBar-actionBtn--upload").should(
          "have.css",
          "background-color",
          primaryColor,
        );
        cy.get(".uppy-DashboardContent-back").should(
          "have.css",
          "color",
          primaryColor,
        );
        cy.get(".uppy-DashboardContent-addMoreCaption").should(
          "have.css",
          "color",
          primaryColor,
        );
      });
  });

  it("3. Check the font-family inside the modal", () => {
    cy.get(".uppy-Dashboard-close").click({ force: true });
    cy.get(commonlocators.canvas).click({ force: true });
    cy.wait(300);

    cy.get(themeLocator.fontsSelected).click({ force: true });

    cy.contains("Roboto").click({ force: true });

    cy.get(commonlocators.filepickerv2).click();
    cy.get(".uppy-DashboardContent-back").should(
      "have.css",
      "font-family",
      "Roboto",
    );
  });
});
