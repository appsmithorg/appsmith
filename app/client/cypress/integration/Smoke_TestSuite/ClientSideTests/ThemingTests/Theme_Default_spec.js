const testdata = require("../../../../fixtures/testdata.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const explorer = require("../../../../locators/explorerlocators.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const themelocator = require("../../../../locators/ThemeLocators.json");

let themeBackgroudColor;
let themeFont;

describe("Theme validation for default data", function() {
  it("Drag and drop form widget and validate Default color/font/shadow/border and list of font validation", function() {
    cy.log("Login Successful");
    cy.reload(); // To remove the rename tooltip
    cy.get(explorer.addWidget).click();
    cy.get(commonlocators.entityExplorersearch).should("be.visible");
    cy.get(commonlocators.entityExplorersearch)
      .clear()
      .type("form");
    cy.dragAndDropToCanvas("formwidget", { x: 300, y: 80 });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(3000);
    cy.get(themelocator.canvas).click({ force: true });
    cy.wait(2000);

    //Border validation
    //cy.contains("Border").click({ force: true });
    cy.get(themelocator.border).should("have.length", "3");
    cy.borderMouseover(0, "none");
    cy.borderMouseover(1, "M");
    cy.borderMouseover(2, "L");
    cy.contains("Border").click({ force: true });

    //Shadow validation
    //cy.contains("Shadow").click({ force: true });
    cy.wait(2000);
    cy.shadowMouseover(0, "none");
    cy.shadowMouseover(1, "S");
    cy.shadowMouseover(2, "M");
    cy.shadowMouseover(3, "L");
    cy.contains("Shadow").click({ force: true });

    //Font
    //cy.contains("Font").click({ force: true });
    cy.get("span[name='expand-more']").then(($elem) => {
      cy.get($elem).click({ force: true });
      cy.wait(250);

      cy.get(themelocator.fontsSelected)
        .eq(0)
        .should("have.text", "Nunito Sans");
    });
    cy.contains("Font").click({ force: true });

    //Color
    //cy.contains("Color").click({ force: true });
    cy.wait(2000);
    cy.colorMouseover(0, "Primary Color");
    cy.validateColor(0, "#553DE9");
    cy.colorMouseover(1, "Background Color");
    cy.validateColor(1, "#F6F6F6");
  });

  it("Validate Default Theme change across application", function() {
    cy.get(formWidgetsPage.formD).click();
    cy.widgetText(
      "FormTest",
      formWidgetsPage.formWidget,
      formWidgetsPage.formInner,
    );
    cy.get(widgetsPage.backgroundcolorPickerNew)
      .first()
      .click({ force: true });
    cy.get("[style='background-color: rgb(21, 128, 61);']")
      .last()
      .click();
    cy.wait(2000);
    cy.get(formWidgetsPage.formD)
      .should("have.css", "background-color")
      .and("eq", "rgb(21, 128, 61)");
    cy.get("#canvas-selection-0").click({ force: true });
    //Change the Theme
    cy.get(commonlocators.changeThemeBtn).click({ force: true });
    cy.get(".cursor-pointer:contains('Applied Theme')").click({ force: true });
    cy.get(".t--theme-card main > main")
      .first()
      .invoke("css", "background-color")
      .then((CurrentBackgroudColor) => {
        cy.get(".bp3-button:contains('Submit')")
          .last()
          .invoke("css", "background-color")
          .then((selectedBackgroudColor) => {
            expect(CurrentBackgroudColor).to.equal(selectedBackgroudColor);
            themeBackgroudColor = CurrentBackgroudColor;
          });
      });
  });

  it("Publish the App and validate Default Theme across the app", function() {
    cy.PublishtheApp();
    cy.get(".bp3-button:contains('Submit')")
      .invoke("css", "background-color")
      .then((CurrentBackgroudColor) => {
        cy.get(".bp3-button:contains('Edit App')")
          .invoke("css", "background-color")
          .then((selectedBackgroudColor) => {
            expect(CurrentBackgroudColor).to.equal(selectedBackgroudColor);
            expect(CurrentBackgroudColor).to.equal(themeBackgroudColor);
            expect(selectedBackgroudColor).to.equal(themeBackgroudColor);
          });
      });
  });
});
