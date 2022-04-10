const testdata = require("../../../../fixtures/testdata.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const explorer = require("../../../../locators/explorerlocators.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");

let themeBackgroudColor;
let themeFont;

describe("Theme validation", function() {
  it("Drag and drop form widget and validate default theme validation", function() {
    cy.log("Login Successful");
    cy.reload(); // To remove the rename tooltip
    cy.get(explorer.addWidget).click();
    cy.get(commonlocators.entityExplorersearch).should("be.visible");
    cy.get(commonlocators.entityExplorersearch)
      .clear()
      .type("form");
    cy.dragAndDropToCanvas("formwidget", { x: 300, y: 80 });
    cy.get("[data-testid='div-selection-0']").click({ force: true });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(5000);
    cy.get(commonlocators.changeThemeBtn)
      .should("be.visible")
      .click({ force: true });
    // select a theme
    cy.get(commonlocators.themeCard)
      .last()
      .click({ force: true });

    // check for alert
    cy.get(`${commonlocators.themeCard}`)
      .last()
      .siblings("div")
      .first()
      .invoke("text")
      .then((text) => {
        cy.get(commonlocators.toastmsg).contains(`Theme ${text} Applied`);
      });
    cy.get(`${commonlocators.themeCard} > main`)
      .last()
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        cy.get(commonlocators.canvas).should(
          "have.css",
          "background-color",
          backgroudColor,
        );
      });
    cy.get(".cursor-pointer:contains('Current Theme')").click({ force: true });

    cy.get(".t--theme-card > main")
      .first()
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        cy.get(commonlocators.canvas).should(
          "have.css",
          "background-color",
          backgroudColor,
        );
      });

    cy.get(".t--theme-card main > main")
      .first()
      .invoke("css", "background-color")
      .then((CurrentBackgroudColor) => {
        cy.get(".t--theme-card main > main")
          .last()
          .invoke("css", "background-color")
          .then((selectedBackgroudColor) => {
            expect(CurrentBackgroudColor).to.equal(selectedBackgroudColor);
            themeBackgroudColor = CurrentBackgroudColor;
          });
      });
    cy.get(formWidgetsPage.formD).click();
    /**
     * @param{Text} Random Text
     * @param{FormWidget}Mouseover
     * @param{FormPre Css} Assertion
     */
    cy.widgetText(
      "FormTest",
      formWidgetsPage.formWidget,
      formWidgetsPage.formInner,
    );
    /**
     * @param{Text} Random Colour
     */

    cy.get(widgetsPage.backgroundcolorPickerNew)
      .first()
      .click({ force: true });
    cy.get("[style='background-color: rgb(21, 128, 61);']")
      .last()
      .click();
    cy.wait(5000);
    cy.get(formWidgetsPage.formD)
      .should("have.css", "background-color")
      .and("eq", "rgb(21, 128, 61)");
  });

  it("Publish the App and validate Theme across the app", function() {
    cy.PublishtheApp();
    cy.wait(10000);
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

  it("Validate Default font and Update Font and validate across app", function() {
    cy.goToEditFromPublish();
    cy.get("#canvas-selection-0").click({ force: true });
    //Change the font
    cy.contains("Font").click({ force: true });
    cy.get("span[name='expand-more']").then(($elem) => {
      cy.get($elem).click({ force: true });
      cy.wait(250);
      cy.fixture("fontData").then(function(testdata) {
        this.testdata = testdata;
      });
      cy.get(".leading-normal")
        .eq(0)
        .should("have.text", "System Default");
      cy.get(selector).each(($ele, i) => {
        expect($ele).to.have.text(this.testdata.dropdownValues[i]);
      });
      cy.get(".ads-dropdown-options-wrapper div")
        .children()
        .eq(2)
        .then(($childElem) => {
          cy.get($childElem).click({ force: true });
          cy.get(
            ".t--draggable-formbuttonwidget button :contains('Submit')",
          ).should(
            "have.css",
            "font-family",
            $childElem
              .children()
              .last()
              .text(),
          );
          themeFont = $childElem
            .children()
            .last()
            .text();
        });
    });
  });

  it("Publish the App and validate Theme across the app", function() {
    cy.PublishtheApp();
    cy.get(".bp3-button:contains('Submit')").should(
      "have.css",
      "font-family",
      themeFont,
    );
    cy.get(".bp3-button:contains('Edit App')").should(
      "have.css",
      "font-family",
      themeFont,
    );
    cy.get(".bp3-button:contains('Share')").should(
      "have.css",
      "font-family",
      themeFont,
    );
    cy.get(".bp3-button:contains('Reset')").should(
      "have.css",
      "font-family",
      themeFont,
    );
  });
});
