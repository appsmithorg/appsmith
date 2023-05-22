const commonlocators = require("../../../../locators/commonlocators.json");
const themelocator = require("../../../../locators/ThemeLocators.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import * as _ from "../../../../support/Objects/ObjectsCore";

let themeFont;
let theme = ObjectsRegistry.ThemeSettings,
  propPane = ObjectsRegistry.PropertyPane,
  ee = ObjectsRegistry.EntityExplorer,
  appSettings = ObjectsRegistry.AppSettings;
//theme = ObjectsRegistry.ThemeSettings;

describe("Theme validation usecase for multi-select widget", function () {
  //it("1. Drag and drop multi-select widget and validate Default font and list of font validation + Bug 15007", function () {
  it("1. Drag and drop multi-select widget and navigate to Theme Settings", function () {
    ee.DragDropWidgetNVerify("multiselectwidgetv2", 300, 80);
    cy.get(themelocator.canvas).click({ force: true });
    cy.wait(2000);
    appSettings.OpenAppSettings();
    appSettings.GoToThemeSettings();
  });
  it("2. validate Border type selection", function () {
    theme.validateBorderTypeCount(3);
    theme.validateBorderPopoverText(0, "none");
    theme.validateBorderPopoverText(1, "M");
    theme.validateBorderPopoverText(2, "L");
    theme.toggleSection("Border");
  });
  it("3.validate Shadow type selection", function () {
    theme.validateShadowPopoverText(0, "none");
    theme.validateShadowPopoverText(1, "S");
    theme.validateShadowPopoverText(2, "M");
    theme.validateShadowPopoverText(3, "L");
    theme.toggleSection("Shadow");
  });
  it.skip("4.validate Change theme color", function () {
    theme.ChangeThemeColor("purple", "Primary");
    cy.get(themelocator.inputColor).should("have.value", "purple");
    cy.wait(1000);
    theme.ChangeThemeColor("brown", "Background");
    cy.get(themelocator.inputColor).should("have.value", "brown");
    cy.wait(1000);
    cy.contains("Color").click({ force: true });
    appSettings.ClosePane();
  });

  it("5.validate applied theme", function () {
    theme.clickOnChangeTheme();
    theme.clickOnAppliedTheme();
    cy.get(theme.locators._appliedThemecard)
      .first()
      .invoke("css", "background-color")
      .then(() => {
        cy.get(theme.locators._testWidgetMutliSelect)
          .last()
          .invoke("css", "background-color")
          .then((selectedBackgroudColor) => {
            expect("rgba(0, 0, 0, 0)").to.equal(selectedBackgroudColor);
          });
      });
    appSettings.ClosePane();
  });
});
// /*
//     cy.borderMouseover(0, "none");
//     cy.borderMouseover(1, "M");
//     cy.borderMouseover(2, "L");
//     */
//     cy.get(themelocator.border).eq(1).click({ force: true });
//     cy.wait("@updateTheme").should(
//       "have.nested.property",
//       "response.body.responseMeta.status",
//       200,
//     );
//     cy.wait(1000);
//     cy.contains("Border").click({ force: true });

//     //Shadow validation
//     //cy.contains("Shadow").click({ force: true });
//     cy.wait(2000);
//     cy.shadowMouseover(0, "none");
//     cy.shadowMouseover(1, "S");
//     cy.shadowMouseover(2, "M");
//     cy.shadowMouseover(3, "L");
//     cy.get(themelocator.shadow).eq(3).click({ force: true });
//     cy.wait("@updateTheme").should(
//       "have.nested.property",
//       "response.body.responseMeta.status",
//       200,
//     );
//     cy.wait(1000);
//     cy.contains("Shadow").click({ force: true });

//     //Font
//     cy.get("span[name='expand-more']").then(($elem) => {
//       cy.get($elem).click({ force: true });
//       cy.wait(250);
//       cy.fixture("fontData").then(function (testdata) {
//         this.testdata = testdata;
//       });

//       cy.get(themelocator.fontsSelected)
//         .eq(10)
//         .should("have.text", "Nunito Sans");

//       cy.get(".ads-dropdown-options-wrapper div")
//         .children()
//         .eq(2)
//         .then(($childElem) => {
//           cy.get($childElem).click({ force: true });
//           cy.get(".t--draggable-multiselectwidgetv2:contains('more')").should(
//             "have.css",
//             "font-family",
//             `${$childElem.children().last().text()}, sans-serif`,
//           );
//           themeFont = $childElem.children().last().text();
//         });
//     });
//     cy.contains("Font").click({ force: true });

//     //Color
//     cy.wait(1000);
//     propPane.ChangeThemeColor("purple", "Primary");
//     cy.get(themelocator.inputColor).should("have.value", "purple");
//     cy.wait(1000);

//     propPane.ChangeThemeColor("brown", "Background");
//     cy.get(themelocator.inputColor).should("have.value", "brown");
//     cy.wait(1000);
//     cy.contains("Color").click({ force: true });
//     appSettings.ClosePane();
//   });

//   it.skip("2. Publish the App and validate Font across the app + Bug 15007", function () {
//     //Skipping due to mentioned bug
//     cy.PublishtheApp();
//     cy.get(".rc-select-selection-item > .rc-select-selection-item-content")
//       .first()
//       .should("have.css", "font-family", themeFont);
//     cy.get(".rc-select-selection-item > .rc-select-selection-item-content")
//       .last()
//       .should("have.css", "font-family", themeFont);
//     cy.goToEditFromPublish();
//   });

//   it("3. Validate current theme feature", function () {
//     cy.get("#canvas-selection-0").click({ force: true });
//     appSettings.OpenAppSettings();
//     appSettings.GoToThemeSettings();
//     //Change the Theme
//     cy.get(commonlocators.changeThemeBtn).click({ force: true });
//     cy.get(themelocator.currentTheme).click({ force: true });
//     cy.get(".t--theme-card main > main")
//       .first()
//       .invoke("css", "background-color")
//       .then(() => {
//         cy.get(".t--draggable-multiselectwidgetv2:contains('more')")
//           .last()
//           .invoke("css", "background-color")
//           .then((selectedBackgroudColor) => {
//             expect("rgba(0, 0, 0, 0)").to.equal(selectedBackgroudColor);
//             appSettings.ClosePane();
//           });
//       });

//     //Publish the App and validate change of Theme across the app in publish mode
//     cy.PublishtheApp();
//     cy.xpath("//div[@id='root']//section/parent::div").should(
//       "have.css",
//       "background-color",
//       "rgb(165, 42, 42)",
//     );
//   });
// });
