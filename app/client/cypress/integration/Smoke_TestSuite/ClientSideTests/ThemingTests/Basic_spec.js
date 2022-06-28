const commonlocators = require("../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const explorer = require("../../../../locators/explorerlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/replay.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let ee = ObjectsRegistry.EntityExplorer;

describe("App Theming funtionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  let themesSection = (sectionName, themeName) =>
    "//*[text()='" +
    sectionName +
    "']/following-sibling::div//*[text()='" +
    themeName +
    "']";
  let applyTheme = (sectionName, themeName) =>
    themesSection(sectionName, themeName) +
    "/parent::div/following-sibling::div[contains(@class, 't--theme-card')]//div[text()='Apply Theme']";
  let themesDeletebtn = (sectionName, themeName) =>
    themesSection(sectionName, themeName) + "/following-sibling::button";

  it("1. Checks if theme can be changed to one of the existing themes", function() {
    cy.get(commonlocators.changeThemeBtn).click({ force: true });

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

    // check if color of canvas is same as theme bg color
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
  });

  it("2. Checks if theme can be edited", function() {
    cy.get(commonlocators.selectThemeBackBtn).click({ force: true });
    // drop a button widget and click on body
    cy.get(explorer.widgetSwitchId).click();
    cy.dragAndDropToCanvas("buttonwidget", { x: 200, y: 200 }); //iconbuttonwidget
    cy.assertPageSave();
    cy.get("canvas")
      .first(0)
      .trigger("click", { force: true });

    //Click the back button //Commenting below since expanded by default
    //cy.get(commonlocators.selectThemeBackBtn).click({ force: true });

    //Click the border radius toggle
    // cy.contains("Border")
    //   .click({ force: true })
    //   .wait(500);

    // change app border radius
    cy.get(commonlocators.themeAppBorderRadiusBtn)
      .eq(1)
      .click({ force: true });

    // check if border radius is changed on button
    cy.get(`${commonlocators.themeAppBorderRadiusBtn} > div`)
      .eq(1)
      .invoke("css", "border-top-left-radius")
      .then((borderRadius) => {
        cy.get(widgetsPage.widgetBtn).should(
          "have.css",
          "border-radius",
          borderRadius,
        );

        // publish the app
        // cy.PublishtheApp();
        cy.get(widgetsPage.widgetBtn).should(
          "have.css",
          "border-radius",
          borderRadius,
        );
      });

    //Change the color://Commenting below since expanded by default
    //cy.contains("Color").click({ force: true });

    //Change the primary color:
    cy.get(widgetsPage.colorPickerV2Popover)
      .click({ force: true })
      .click();
    cy.get(widgetsPage.colorPickerV2Color)
      .eq(-3)
      .then(($elem) => {
        cy.get($elem).click({ force: true });
        cy.get(widgetsPage.widgetBtn).should(
          "have.css",
          "background-color",
          $elem.css("background-color"),
        );
      });

    //Change the background color:
    cy.get(".border-2")
      .last()
      .click({ force: true });
    cy.wait(500);
    cy.get(widgetsPage.colorPickerV2Popover)
      .click({ force: true })
      .click();
    cy.get(widgetsPage.colorPickerV2Color)
      .first()
      .then(($elem) => {
        cy.get($elem).click({ force: true });
        cy.get(commonlocators.canvas).should(
          "have.css",
          "background-color",
          $elem.css("background-color"),
        );
      });

    //Change the shadow //Commenting below since expanded by default
    //cy.contains("Shadow").click({ force: true });
    cy.contains("App Box Shadow")
      .siblings("div")
      .children("span")
      .last()
      .then(($elem) => {
        cy.get($elem).click({ force: true });
        cy.get(widgetsPage.widgetBtn).should(
          "have.css",
          "box-shadow",
          $elem.css("box-shadow"),
        );
      });

    //Change the font //Commenting below since expanded by default
    //cy.contains("Font").click({ force: true });

    cy.get("span[name='expand-more']").then(($elem) => {
      cy.get($elem).click({ force: true });
      cy.wait(250);
      cy.get(".ads-dropdown-options-wrapper div")
        .children()
        .eq(2)
        .then(($childElem) => {
          cy.get($childElem).click({ force: true });
          cy.get(widgetsPage.widgetBtn).should(
            "have.css",
            "font-family",
            $childElem
              .children()
              .last()
              .text(),
          );
        });
    });
  });

  it("3. Checks if the theme can be saved", () => {
    //Click on dropDown elipses
    cy.contains("Theme Properties")
      .closest("div")
      .siblings()
      .first()
      .find("button")
      .click({ force: true });
    // .then(($elem) => {
    //   cy.get(`${$elem} button`).click({ force: true });
    // })

    cy.wait(300);

    //Click on save theme dropdown option
    cy.contains("Save theme").click({ force: true });

    cy.wait(200);

    //Type the name of the theme:
    cy.get("input[placeholder='My theme']").type("testtheme");

    //Click on save theme button
    cy.get("a[type='submit']").click({ force: true });

    cy.wait(200);
    cy.get(commonlocators.toastMsg).contains("Theme testtheme Saved");
  });

  it("4. Verify Save Theme after changing all properties & widgets conform to the selected theme", () => {
    cy.get(explorer.widgetSwitchId).click();
    cy.dragAndDropToCanvas("iconbuttonwidget", { x: 200, y: 300 });
    cy.assertPageSave();
    cy.get("canvas")
      .first(0)
      .trigger("click", { force: true });

    //#region Change Font & verify widgets:
    // cy.contains("Font")
    //   .click({ force: true })
    //   .wait(200);//Commenting below since expanded by default
    cy.get("span[name='expand-more']").then(($elem) => {
      cy.get($elem).click({ force: true });
      cy.wait(250);
      cy.get(".ads-dropdown-options-wrapper div")
        .children()
        .eq(4)
        .then(($childElem) => {
          cy.get($childElem).click({ force: true });
          cy.get(widgetsPage.iconWidgetBtn).should(
            "have.css",
            "font-family",
            $childElem
              .children()
              .last()
              .text(),
          );
          cy.get(widgetsPage.widgetBtn).should(
            "have.css",
            "font-family",
            $childElem
              .children()
              .last()
              .text(),
          );
        });
    });

    //#endregion

    //#region Change Color & verify widgets:
    //Change the primary color:
    // cy.contains("Color")
    //   .click({ force: true })
    //   .wait(200);
    cy.get(widgetsPage.colorPickerV2Popover)
      .click({ force: true })
      .click();
    cy.get(widgetsPage.colorPickerV2Color)
      .eq(-15)
      .then(($elem) => {
        cy.get($elem).click({ force: true });
        cy.get(widgetsPage.iconWidgetBtn).should(
          "have.css",
          "background-color",
          $elem.css("background-color"),
        );
        cy.get(widgetsPage.widgetBtn).should(
          "have.css",
          "background-color",
          $elem.css("background-color"),
        );
      });

    //Change the background color:
    cy.get(".border-2")
      .last()
      .click({ force: true });
    cy.wait(500);
    cy.get(widgetsPage.colorPickerV2Popover)
      .click({ force: true })
      .click();
    cy.get(widgetsPage.colorPickerV2Color)
      .eq(23)
      .then(($elem) => {
        cy.get($elem).click({ force: true });
        cy.get(commonlocators.canvas).should(
          "have.css",
          "background-color",
          $elem.css("background-color"),
        );
      });

    //#endregion

    //#region Change Border radius & verify widgets
    // cy.contains("Border")
    //   .click({ force: true })
    //   .wait(200);
    cy.get(commonlocators.themeAppBorderRadiusBtn)
      .eq(2)
      .click({ force: true });
    cy.get(`${commonlocators.themeAppBorderRadiusBtn} > div`)
      .eq(2)
      .invoke("css", "border-top-left-radius")
      .then((borderRadius) => {
        cy.get(widgetsPage.iconWidgetBtn).should(
          "have.css",
          "border-radius",
          borderRadius,
        );
        cy.get(widgetsPage.widgetBtn).should(
          "have.css",
          "border-radius",
          borderRadius,
        );
      });

    //#endregion

    //#region Change the shadow & verify widgets
    //cy.contains("Shadow").click({ force: true });
    cy.contains("App Box Shadow")
      .siblings("div")
      .children("span")
      .first()
      .then(($elem) => {
        cy.get($elem).click({ force: true });
        cy.get(widgetsPage.iconWidgetBtn).should(
          "have.css",
          "box-shadow",
          $elem.css("box-shadow"),
        );
        cy.get(widgetsPage.widgetBtn).should(
          "have.css",
          "box-shadow",
          $elem.css("box-shadow"),
        );
      });

    //#endregion

    //#region Click on dropDown elipses
    cy.contains("Theme Properties")
      .closest("div")
      .siblings()
      .first()
      .find("button")
      .click({ force: true });
    cy.wait(300);
    //#endregion

    //Click on save theme dropdown option & close it
    cy.contains("Save theme").click({ force: true });
    cy.wait(200);
    cy.xpath("//*[text()='Save Theme']/following-sibling::button").click();

    //Click on save theme dropdown option & cancel it
    cy.contains("Theme Properties")
      .closest("div")
      .siblings()
      .first()
      .find("button")
      .click({ force: true });
    cy.wait(300);
    cy.contains("Save theme").click({ force: true });
    cy.wait(200);
    cy.xpath("//span[text()='Cancel']/parent::a").click();

    //Click on save theme dropdown option, give duplicte name & save it
    cy.contains("Theme Properties")
      .closest("div")
      .siblings()
      .first()
      .find("button")
      .click({ force: true });
    cy.wait(300);
    cy.contains("Save theme").click({ force: true });
    cy.wait(200);
    //Type the name of the theme:
    cy.get("input[placeholder='My theme']").type("testtheme");
    cy.contains("Name must be unique");

    cy.get("input[placeholder='My theme']")
      .clear()
      .type("VioletYellowTheme");

    //Click on save theme button
    cy.xpath("//span[text()='Save theme']/parent::a").click({ force: true });

    cy.wait(200);
    cy.get(commonlocators.toastMsg).contains("Theme VioletYellowTheme Saved");
  });

  it("5. Verify Themes exists under respective section when ChangeTheme button is cicked in properties with Apply Theme & Trash as applicable", () => {
    //Click on change theme:
    cy.get(commonlocators.changeThemeBtn).click({ force: true });
    cy.xpath(applyTheme("Your Themes", "testtheme"))
      .click({ force: true })
      .wait(1000); //Changing to testtheme

    cy.contains("Applied Theme")
      .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > main")
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(131, 24, 67)");
      });

    //Check if the saved theme is present under 'Yours Themes' section with Trash button
    cy.xpath(applyTheme("Your Themes", "testtheme")).should("exist");
    cy.xpath(themesDeletebtn("Your Themes", "testtheme")).should("exist");

    cy.xpath(applyTheme("Your Themes", "VioletYellowTheme")).should("exist");
    cy.xpath(themesDeletebtn("Your Themes", "VioletYellowTheme")).should(
      "exist",
    );

    cy.xpath(applyTheme("Featured Themes", "Earth")).should("exist");
    cy.xpath(themesDeletebtn("Featured Themes", "Earth")).should("not.exist");

    cy.xpath(applyTheme("Featured Themes", "Sunrise")).should("exist");
    cy.xpath(themesDeletebtn("Featured Themes", "Sunrise")).should("not.exist");

    cy.xpath(applyTheme("Featured Themes", "Pacific")).should("exist");
    cy.xpath(themesDeletebtn("Featured Themes", "Pacific")).should("not.exist");

    cy.xpath(applyTheme("Featured Themes", "Pampas")).should("exist");
    cy.xpath(themesDeletebtn("Featured Themes", "Pampas")).should("not.exist");

    // cy.contains("Featured Themes")
    //   .siblings()
    //   .find(".t--theme-card")
    //   .siblings()
    //   .should("contain.text", "Rounded").siblings()
    //   .contains('Apply Theme');
  });

  it("6. Verify the custom theme can be deleted", () => {
    //Check if the saved theme is present under 'Yours Themes' section
    // cy.contains("Your Themes")
    //   .siblings()
    //   .find(".t--theme-card")
    //   .parent()
    //   .find("button").eq(0)
    //   .click({ force: true });
    //   cy.wait(200);

    cy.xpath(themesDeletebtn("Your Themes", "testtheme"))
      .click()
      .wait(200);
    cy.contains(
      "Do you really want to delete this theme? This process cannot be undone.",
    );

    //Click on Delete theme trash icon & close it
    cy.xpath("//*[text()='Are you sure?']/following-sibling::button").click();
    cy.get(commonlocators.toastMsg).should("not.exist");

    //Click on Delete theme trash icon & cancel it
    cy.xpath(themesDeletebtn("Your Themes", "testtheme"))
      .click()
      .wait(200);
    cy.xpath("//span[text()='Cancel']/parent::a").click();
    cy.get(commonlocators.toastMsg).should("not.exist");

    //Click on Delete theme trash icon & delete it
    cy.xpath(themesDeletebtn("Your Themes", "testtheme"))
      .click()
      .wait(200);
    cy.contains("Delete").click({ force: true });

    //check for delete alert
    cy.wait(500);
    cy.get(commonlocators.toastMsg).contains("Theme testtheme Deleted");
    cy.xpath(applyTheme("Your Themes", "testtheme")).should("not.exist");
  });

  it("7. Verify user able to change between saved theme & already existing Featured themes", () => {
    //#region Pampas
    cy.xpath(applyTheme("Featured Themes", "Pampas"))
      .click({ force: true })
      .wait(1000); //Changing to one of featured themes
    cy.contains("Applied Theme")
      .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(0)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(5, 150, 105)");
      });

    cy.contains("Applied Theme")
      .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(1)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(236, 253, 245)");
      });

    //#endregion

    //#region Classic
    cy.xpath(applyTheme("Featured Themes", "Classic"))
      .click({ force: true })
      .wait(1000); //Changing to one of featured themes
    cy.contains("Applied Theme")
      .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(0)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(22, 163, 74)");
      });

    cy.contains("Applied Theme")
      .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(1)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(246, 246, 246)");
      });

    //#endregion

    //#region Modern
    cy.xpath(applyTheme("Featured Themes", "Modern"))
      .click({ force: true })
      .wait(1000); //Changing to one of featured themes
    cy.contains("Applied Theme")
      .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(0)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(85, 61, 233)");
      });

    cy.contains("Applied Theme")
      .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(1)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(246, 246, 246)");
      });

    //#endregion

    //#region Sunrise
    cy.xpath(applyTheme("Featured Themes", "Sunrise"))
      .click({ force: true })
      .wait(1000); //Changing to one of featured themes
    cy.contains("Applied Theme")
      .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(0)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(239, 68, 68)");
      });

    cy.contains("Applied Theme")
      .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(1)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(255, 241, 242)");
      });
    //#endregion

    //#region Water Lily
    cy.xpath(applyTheme("Featured Themes", "Water Lily"))
      .click({ force: true })
      .wait(1000); //Changing to one of featured themes
    cy.contains("Applied Theme")
      .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(0)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(219, 39, 119)");
      });

    cy.contains("Applied Theme")
      .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(1)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(253, 242, 248)");
      });
    //#endregion

    //#region Pacific
    cy.xpath(applyTheme("Featured Themes", "Pacific"))
      .click({ force: true })
      .wait(1000); //Changing to one of featured themes
    cy.contains("Applied Theme")
      .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(0)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(8, 145, 178)");
      });

    cy.contains("Applied Theme")
      .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(1)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(236, 254, 255)");
      });
    //#endregion

    //#region Earth
    cy.xpath(applyTheme("Featured Themes", "Earth"))
      .click({ force: true })
      .wait(1000); //Changing to one of featured themes
    cy.contains("Applied Theme")
      .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(0)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(59, 130, 246)");
      });

    cy.contains("Applied Theme")
      .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(1)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(239, 246, 255)");
      });
    //#endregion

    //#region Moon
    cy.xpath(applyTheme("Featured Themes", "Moon"))
      .click({ force: true })
      .wait(1000); //Changing to one of featured themes
    cy.contains("Applied Theme")
      .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(0)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(100, 116, 139)");
      });

    cy.contains("Applied Theme")
      .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(1)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(248, 250, 252)");
      });
    //#endregion

    //#region VioletYellowTheme
    cy.xpath(applyTheme("Your Themes", "VioletYellowTheme"))
      .click({ force: true })
      .wait(1000); //Changing to created test theme

    cy.contains("Applied Theme")
      .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(0)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(126, 34, 206)");
      });

    cy.contains("Applied Theme")
      .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(1)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(253, 224, 71)");
      });

    //#endregion
  });

  it("8. Verify widgets conform to the selected theme in Publish mode", () => {
    cy.PublishtheApp();

    //cy.wait(4000); //for theme to settle

    cy.get("body").should("have.css", "font-family", "Montserrat"); //Font

    cy.xpath("//div[@id='root']//section/parent::div").should(
      "have.css",
      "background-color",
      "rgb(253, 224, 71)",
    ); //Background Color
    cy.get(widgetsPage.widgetBtn).should(
      "have.css",
      "background-color",
      "rgb(126, 34, 206)",
    ); //Widget Color
    cy.get(publish.iconWidgetBtn).should(
      "have.css",
      "background-color",
      "rgb(126, 34, 206)",
    ); //Widget Color

    cy.get(widgetsPage.widgetBtn).should("have.css", "border-radius", "24px"); //Border Radius
    cy.get(publish.iconWidgetBtn).should("have.css", "border-radius", "24px"); //Border Radius

    cy.get(widgetsPage.widgetBtn).should("have.css", "box-shadow", "none"); //Shadow
    cy.get(publish.iconWidgetBtn).should("have.css", "box-shadow", "none"); //Shadow

    //Verify Share button
    cy.contains("Share").should(
      "have.css",
      "border-top-color",
      "rgb(126, 34, 206)",
    ); //Color
    cy.contains("Share")
      .closest("div")
      .should("have.css", "font-family", "Montserrat"); //Font

    //Verify Edit App button
    cy.contains("Edit App").should(
      "have.css",
      "background-color",
      "rgb(126, 34, 206)",
    ); //Color
    cy.contains("Edit App")
      .closest("div")
      .should("have.css", "font-family", "Montserrat"); //Font

    cy.get(publish.backToEditor)
      .click({ force: true })
      .wait(3000);
  });

  it("9. Verify Adding new Individual widgets & it can change Color, Border radius, Shadow & can revert [Color/Border Radius] to already selected theme", () => {
    cy.get(explorer.widgetSwitchId).click();
    cy.dragAndDropToCanvas("buttonwidget", { x: 200, y: 400 }); //another button widget
    cy.assertPageSave();

    //Change Color & verify
    cy.get(widgetsPage.colorPickerV2Popover)
      .click({ force: true })
      .click();
    cy.get(widgetsPage.colorPickerV2Color)
      .eq(35)
      .then(($elem) => {
        cy.get($elem).click({ force: true });
        cy.get(widgetsPage.widgetBtn)
          .eq(1)
          .should(
            "have.css",
            "background-color",
            $elem.css("background-color"), //rgb(134, 239, 172)
          ); //new widget with its own color

        cy.get(widgetsPage.widgetBtn)
          .eq(0)
          .should("have.css", "background-color", "rgb(126, 34, 206)"); //old widgets still conforming to theme color
        cy.get(widgetsPage.iconWidgetBtn).should(
          "have.css",
          "background-color",
          "rgb(126, 34, 206)",
        );
      });

    //Change Border & verify

    cy.get(".t--button-tab-0px").click();
    cy.get(".t--button-tab-0px")
      .eq(0)
      .invoke("css", "border-top-left-radius")
      .then((borderRadius) => {
        cy.get(widgetsPage.widgetBtn)
          .eq(1)
          .should(
            "have.css",
            "border-radius",
            borderRadius, //0px
          );
        cy.get(widgetsPage.iconWidgetBtn).should(
          "have.css",
          "border-radius",
          "24px",
        );
        cy.get(widgetsPage.widgetBtn)
          .eq(0)
          .should("have.css", "border-radius", "24px");
      });

    //Change Shadow & verify
    cy.get(".t--button-tab-0.10px").click();
    cy.get(".t--button-tab-0.10px div")
      .eq(0)
      .invoke("css", "box-shadow")
      .then((boxshadow) => {
        cy.get(widgetsPage.widgetBtn)
          .eq(1)
          .should(
            "have.css",
            "box-shadow",
            boxshadow, //rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px
          );
        cy.get(widgetsPage.iconWidgetBtn).should(
          "have.css",
          "box-shadow",
          "none",
        );
        cy.get(widgetsPage.widgetBtn)
          .eq(0)
          .should("have.css", "box-shadow", "none");
      });

    cy.assertPageSave();

    cy.PublishtheApp();

    //Verify Background color
    cy.get(widgetsPage.widgetBtn)
      .eq(1)
      .should(
        "have.css",
        "background-color",
        "rgb(134, 239, 172)", //rgb(134, 239, 172)
      ); //new widget with its own color

    ////old widgets still conforming to theme color
    cy.get(widgetsPage.widgetBtn)
      .eq(0)
      .should("have.css", "background-color", "rgb(126, 34, 206)");
    cy.get(publish.iconWidgetBtn).should(
      "have.css",
      "background-color",
      "rgb(126, 34, 206)",
    );

    //Verify Border radius
    cy.get(widgetsPage.widgetBtn)
      .eq(1)
      .should("have.css", "border-radius", "0px");
    cy.get(publish.iconWidgetBtn).should("have.css", "border-radius", "24px");
    cy.get(widgetsPage.widgetBtn)
      .eq(0)
      .should("have.css", "border-radius", "24px");

    //Verify Box shadow
    cy.get(widgetsPage.widgetBtn)
      .eq(1)
      .should(
        "have.css",
        "box-shadow",
        "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
      );
    cy.get(publish.iconWidgetBtn).should("have.css", "box-shadow", "none");
    cy.get(widgetsPage.widgetBtn)
      .eq(0)
      .should("have.css", "box-shadow", "none");

    cy.get(publish.backToEditor)
      .click({ force: true })
      .wait(1000);

    //Resetting back to theme
    ee.NavigateToSwitcher("explorer");
    ee.ExpandCollapseEntity("WIDGETS"); //to expand widgets
    ee.SelectEntityByName("Button2");
    cy.get(".t--property-control-buttoncolor .reset-button").then(($elem) => {
      $elem[0].removeAttribute("display: none");
      $elem[0].click();
    });

    cy.get(widgetsPage.widgetBtn)
      .eq(1)
      .should("have.css", "background-color", "rgb(126, 34, 206)"); //verify widget reverted to theme color

    cy.get(".t--property-control-borderradius .reset-button").then(($elem) => {
      $elem[0].removeAttribute("display: none");
      $elem[0].click();
    });
    cy.get(widgetsPage.widgetBtn)
      .eq(1)
      .should("have.css", "border-radius", "24px");

    //the new widget with reverted styles also conforming to theme
    cy.PublishtheApp();

    cy.wait(2000); //for theme to settle
    cy.get("body").should("have.css", "font-family", "Montserrat"); //Font

    cy.xpath("//div[@id='root']//section/parent::div").should(
      "have.css",
      "background-color",
      "rgb(253, 224, 71)",
    ); //Background Color
    cy.get(widgetsPage.widgetBtn)
      .eq(0)
      .should("have.css", "background-color", "rgb(126, 34, 206)"); //Widget Color
    cy.get(widgetsPage.widgetBtn)
      .eq(1)
      .should("have.css", "background-color", "rgb(126, 34, 206)"); //Widget Color
    cy.get(publish.iconWidgetBtn).should(
      "have.css",
      "background-color",
      "rgb(126, 34, 206)",
    ); //Widget Color

    cy.get(widgetsPage.widgetBtn)
      .eq(0)
      .should("have.css", "border-radius", "24px"); //Border Radius
    cy.get(widgetsPage.widgetBtn)
      .eq(1)
      .should("have.css", "border-radius", "24px"); //Border Radius
    cy.get(publish.iconWidgetBtn).should("have.css", "border-radius", "24px"); //Border Radius

    cy.get(widgetsPage.widgetBtn)
      .eq(0)
      .should("have.css", "box-shadow", "none"); //Shadow
    cy.get(widgetsPage.widgetBtn)
      .eq(1)
      .should(
        "have.css",
        "box-shadow",
        "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
      ); //Since Shadow revert option does not exixts
    cy.get(publish.iconWidgetBtn).should("have.css", "box-shadow", "none"); //Shadow

    //Verify Share button
    cy.contains("Share").should(
      "have.css",
      "border-top-color",
      "rgb(126, 34, 206)",
    ); //Color
    cy.contains("Share")
      .closest("div")
      .should("have.css", "font-family", "Montserrat"); //Font

    //Verify Edit App button
    cy.contains("Edit App").should(
      "have.css",
      "background-color",
      "rgb(126, 34, 206)",
    ); //Color
    cy.contains("Edit App")
      .closest("div")
      .should("have.css", "font-family", "Montserrat"); //Font

    cy.get(publish.backToEditor)
      .click({ force: true })
      .wait(2000);
  });

  it("10. Verify Chainging theme should not affect Individual widgets with changed Color, Border radius, Shadow & can revert to newly selected theme", () => {
    cy.get("canvas")
      .first(0)
      .trigger("click", { force: true });

    cy.get(commonlocators.changeThemeBtn).click({ force: true });

    //Changing to one of featured themes & then changing individual widget properties
    cy.xpath(applyTheme("Featured Themes", "Sunrise"))
      .click({ force: true })
      .wait(2000);

    //Change individual widget properties for Button1
    ee.NavigateToSwitcher("explorer");
    ee.ExpandCollapseEntity("WIDGETS"); //to expand widgets
    ee.SelectEntityByName("Button1");

    //Change Color & verify
    cy.get(widgetsPage.colorPickerV2Popover)
      .click({ force: true })
      .click();
    cy.get(widgetsPage.colorPickerV2Color)
      .eq(17)
      .then(($elem) => {
        cy.get($elem).click({ force: true });
        cy.get(widgetsPage.widgetBtn)
          .eq(0)
          .should(
            "have.css",
            "background-color",
            $elem.css("background-color"),
          ); //new widget with its own color

        cy.get(widgetsPage.widgetBtn)
          .eq(1)
          .should("have.css", "background-color", "rgb(239, 68, 68)"); //old widgets still conforming to theme color
        cy.get(widgetsPage.iconWidgetBtn).should(
          "have.css",
          "background-color",
          "rgb(239, 68, 68)",
        );
      });

    //Change Border & verify

    cy.get(".t--button-tab-0\\.375rem")
      .click()
      .wait(500);
    cy.get(".t--button-tab-0\\.375rem div")
      .eq(0)
      .invoke("css", "border-top-left-radius")
      .then((borderRadius) => {
        cy.get(widgetsPage.widgetBtn)
          .eq(0)
          .should(
            "have.css",
            "border-radius",
            borderRadius, //6px
          );
        cy.get(widgetsPage.iconWidgetBtn).should(
          "have.css",
          "border-radius",
          "24px",
        );
        cy.get(widgetsPage.widgetBtn)
          .eq(1)
          .should("have.css", "border-radius", "24px");
      });

    //Change Shadow & verify
    cy.get(".t--button-tab-0.1px")
      .click()
      .wait(500);
    cy.get(".t--button-tab-0.1px div")
      .invoke("css", "box-shadow")
      .then((boxshadow) => {
        cy.get(widgetsPage.widgetBtn)
          .eq(0)
          .should(
            "have.css",
            "box-shadow",
            boxshadow, //rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 1px 2px 0px
          );
        cy.get(widgetsPage.iconWidgetBtn).should(
          "have.css",
          "box-shadow",
          "none",
        );
        cy.get(widgetsPage.widgetBtn)
          .eq(1)
          .should(
            "have.css",
            "box-shadow",
            //same value as previous box shadow selection
            //since revertion is not possible for box shadow - hence this widget maintains the same value
            "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
          );
      });

    cy.assertPageSave();

    //Add deploy mode verification here also!
    cy.PublishtheApp();

    //Verify Background color
    cy.get(widgetsPage.widgetBtn)
      .eq(0)
      .should("have.css", "background-color", "rgb(252, 165, 165)"); //new widget with its own color

    ////old widgets still conforming to theme color
    cy.get(widgetsPage.widgetBtn)
      .eq(1)
      .should("have.css", "background-color", "rgb(239, 68, 68)");
    cy.get(publish.iconWidgetBtn).should(
      "have.css",
      "background-color",
      "rgb(239, 68, 68)",
    );

    //Verify Border radius
    cy.get(widgetsPage.widgetBtn)
      .eq(0)
      .should("have.css", "border-radius", "6px");
    cy.get(publish.iconWidgetBtn).should("have.css", "border-radius", "24px");
    cy.get(widgetsPage.widgetBtn)
      .eq(1)
      .should("have.css", "border-radius", "24px");

    //Verify Box shadow
    cy.get(widgetsPage.widgetBtn)
      .eq(0)
      .should(
        "have.css",
        "box-shadow",
        "rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 1px 2px 0px",
      );
    cy.get(publish.iconWidgetBtn).should("have.css", "box-shadow", "none");
    cy.get(widgetsPage.widgetBtn)
      .eq(1)
      .should(
        "have.css",
        "box-shadow",
        "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
      );

    cy.get(publish.backToEditor)
      .click({ force: true })
      .wait(1000);

    //Resetting back to theme
    ee.NavigateToSwitcher("explorer");
    ee.ExpandCollapseEntity("WIDGETS"); //to expand widgets
    ee.SelectEntityByName("Button1");
    cy.get(".t--property-control-buttoncolor .reset-button").then(($elem) => {
      $elem[0].removeAttribute("display: none");
      $elem[0].click();
    });

    cy.get(widgetsPage.widgetBtn)
      .eq(0)
      .should("have.css", "background-color", "rgb(239, 68, 68)"); //verify widget reverted to theme color

    cy.get(".t--property-control-borderradius .reset-button").then(($elem) => {
      $elem[0].removeAttribute("display: none");
      $elem[0].click();
    });
    cy.get(widgetsPage.widgetBtn)
      .eq(0)
      .should("have.css", "border-radius", "24px");

    //the new widget with reverted styles also conforming to theme
    cy.PublishtheApp();

    cy.wait(2000); //for theme to settle
    cy.get("body").should("have.css", "font-family", "Rubik"); //Font for Rounded theme

    cy.xpath("//div[@id='root']//section/parent::div").should(
      "have.css",
      "background-color",
      "rgb(255, 241, 242)",
    ); //Background Color of canvas
    cy.get(widgetsPage.widgetBtn)
      .eq(0)
      .should("have.css", "background-color", "rgb(239, 68, 68)"); //Widget Color
    cy.get(widgetsPage.widgetBtn)
      .eq(1)
      .should("have.css", "background-color", "rgb(239, 68, 68)"); //Widget Color
    cy.get(publish.iconWidgetBtn).should(
      "have.css",
      "background-color",
      "rgb(239, 68, 68)",
    ); //Widget Color

    cy.get(widgetsPage.widgetBtn)
      .eq(0)
      .should("have.css", "border-radius", "24px"); //Border Radius
    cy.get(widgetsPage.widgetBtn)
      .eq(1)
      .should("have.css", "border-radius", "24px"); //Border Radius
    cy.get(publish.iconWidgetBtn).should("have.css", "border-radius", "24px"); //Border Radius

    cy.get(widgetsPage.widgetBtn)
      .eq(0)
      .should(
        "have.css",
        "box-shadow",
        "rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 1px 2px 0px",
      ); //Shadow
    cy.get(widgetsPage.widgetBtn)
      .eq(1)
      .should(
        "have.css",
        "box-shadow",
        "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
      ); //Since Shadow revert option does not exixts
    cy.get(publish.iconWidgetBtn).should("have.css", "box-shadow", "none"); //Shadow

    //Verify Share button
    cy.contains("Share").should(
      "have.css",
      "border-top-color",
      "rgb(239, 68, 68)",
    ); //Color
    cy.contains("Share")
      .closest("div")
      .should("have.css", "font-family", "Rubik"); //Font

    //Verify Edit App button
    cy.contains("Edit App").should(
      "have.css",
      "background-color",
      "rgb(239, 68, 68)",
    ); //Color
    cy.contains("Edit App")
      .closest("div")
      .should("have.css", "font-family", "Rubik"); //Font

    cy.get(publish.backToEditor)
      .click({ force: true })
      .wait(1000);
  });
});
