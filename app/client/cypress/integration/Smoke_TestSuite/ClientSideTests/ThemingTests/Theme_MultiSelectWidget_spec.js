const commonlocators = require("../../../../locators/commonlocators.json");
const explorer = require("../../../../locators/explorerlocators.json");
const themelocator = require("../../../../locators/ThemeLocators.json");

let themeBackgroudColor;
let themeFont;
let themeColour;

describe("Theme validation usecase for multi-select widget", function() {
  it("Drag and drop multi-select widget and validate Default font and list of font validation + Bug 15007", function() {
    cy.log("Login Successful");
    cy.reload(); // To remove the rename tooltip
    cy.get(explorer.addWidget).click();
    cy.get(commonlocators.entityExplorersearch).should("be.visible");
    cy.get(commonlocators.entityExplorersearch)
      .clear()
      .wait(200)
      .click()
      .type("multiselect");
    cy.dragAndDropToCanvas("multiselectwidgetv2", { x: 300, y: 80 });
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
    cy.get(themelocator.border)
      .eq(1)
      .click({ force: true });
    cy.wait("@updateTheme").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(3000);
    cy.contains("Border").click({ force: true });

    //Shadow validation
    //cy.contains("Shadow").click({ force: true });
    cy.wait(2000);
    cy.shadowMouseover(0, "none");
    cy.shadowMouseover(1, "S");
    cy.shadowMouseover(2, "M");
    cy.shadowMouseover(3, "L");
    cy.xpath(themelocator.shadow)
      .eq(3)
      .click({ force: true });
    cy.wait("@updateTheme").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(5000);
    cy.contains("Shadow").click({ force: true });

    //Font
    cy.get("span[name='expand-more']").then(($elem) => {
      cy.get($elem).click({ force: true });
      cy.wait(250);
      cy.fixture("fontData").then(function(testdata) {
        this.testdata = testdata;
      });

      cy.get(themelocator.fontsSelected)
        .eq(0)
        .should("have.text", "Nunito Sans");

      cy.get(".ads-dropdown-options-wrapper div")
        .children()
        .eq(2)
        .then(($childElem) => {
          cy.get($childElem).click({ force: true });
          cy.get(".t--draggable-multiselectwidgetv2:contains('more')").should(
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
    //cy.contains("Font").click({ force: true });

    //Color
    cy.wait(3000);
    cy.get(themelocator.inputColor)
      .clear()
      .wait(200)
      .click()
      .type("purple");
    cy.get(themelocator.inputColor).should("have.value", "purple");
    cy.get(themelocator.color)
      .eq(1)
      .click({ force: true });
    cy.wait(2000);
    cy.get(themelocator.inputColor)
      .clear()
      .wait(200)
      .click()
      .type("brown");
    cy.get(themelocator.inputColor).should("have.value", "brown");
    cy.wait(2000);
    cy.contains("Color").click({ force: true });
  });

  it.skip("Publish the App and validate Font across the app + Bug 15007", function() {
    //Skipping due to mentioned bug
    cy.PublishtheApp();
    cy.get(".rc-select-selection-item > .rc-select-selection-item-content")
      .first()
      .should("have.css", "font-family", themeFont);
    cy.get(".rc-select-selection-item > .rc-select-selection-item-content")
      .last()
      .should("have.css", "font-family", themeFont);
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
    cy.goToEditFromPublish();
  });

  it("Validate Default Theme change across application", function() {
    cy.get("#canvas-selection-0").click({ force: true });
    //Change the Theme
    cy.get(commonlocators.changeThemeBtn).click({ force: true });
    cy.get(themelocator.currentTheme).click({ force: true });
    cy.get(".t--theme-card main > main")
      .first()
      .invoke("css", "background-color")
      .then((CurrentBackgroudColor) => {
        cy.get(".t--draggable-multiselectwidgetv2:contains('more')")
          .last()
          .invoke("css", "background-color")
          .then((selectedBackgroudColor) => {
            expect("rgba(0, 0, 0, 0)").to.equal(selectedBackgroudColor);
            themeBackgroudColor = CurrentBackgroudColor;
            themeColour = selectedBackgroudColor;
          });
      });
  });

  it("Publish the App and validate Default Theme across the app", function() {
    cy.PublishtheApp();
    cy.get(".rc-select-selection-item > .rc-select-selection-item-content")
      .first()
      .invoke("css", "background-color")
      .then((CurrentBackgroudColor) => {
        cy.get(".bp3-button:contains('Edit App')")
          .invoke("css", "background-color")
          .then((selectedBackgroudColor) => {
            expect(CurrentBackgroudColor).to.equal(themeColour);
            expect(selectedBackgroudColor).to.equal(themeBackgroudColor);
          });
      });
  });
});
