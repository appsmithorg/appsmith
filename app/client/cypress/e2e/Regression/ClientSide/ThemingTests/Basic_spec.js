const commonlocators = require("../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

const containerShadowElement = `${widgetsPage.containerWidget}`;

describe("App Theming funtionality", function () {
  let themesSection = (sectionName, themeName) =>
    "//*[text()='" +
    sectionName +
    "']/following-sibling::div//*[text()='" +
    themeName +
    "']";
  let applyTheme = (sectionName, themeName) =>
    themesSection(sectionName, themeName) +
    "/parent::div/following-sibling::div[contains(@class, 't--theme-card')]//div[text()='Apply theme']";
  let themesDeletebtn = (sectionName, themeName) =>
    themesSection(sectionName, themeName) + "/following-sibling::button";

  it("1. Checks if theme can be changed to one of the existing themes", function () {
    _.appSettings.OpenAppSettings();
    _.appSettings.GoToThemeSettings();
    cy.get(commonlocators.changeThemeBtn).click({ force: true });

    // select a theme
    cy.get(commonlocators.themeCard).last().click({ force: true });

    // check for alert
    cy.get(`${commonlocators.themeCard}`)
      .last()
      .siblings("div")
      .first()
      .invoke("text")
      .then((text) => {
        cy.get(commonlocators.toastmsg).contains(`Theme ${text} applied`);
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

  it("2. Checks if theme can be edited", function () {
    cy.get(commonlocators.selectThemeBackBtn).click({ force: true });
    _.appSettings.ClosePane();

    // drop a button & container widget and click on body
    _.entityExplorer.NavigateToSwitcher("Widgets");
    cy.dragAndDropToCanvas("buttonwidget", { x: 200, y: 200 });
    cy.dragAndDropToCanvas("containerwidget", { x: 200, y: 50 });
    cy.assertPageSave();
    cy.get("canvas").first(0).trigger("click", { force: true });

    _.appSettings.OpenAppSettings();
    _.appSettings.GoToThemeSettings();

    //Click the back button //Commenting below since expanded by default
    //cy.get(commonlocators.selectThemeBackBtn).click({ force: true });

    //Click the border radius toggle
    // cy.contains("Border")
    //   .click({ force: true })
    //   .wait(500);

    // change app border radius
    cy.get(commonlocators.themeAppBorderRadiusBtn).eq(1).click({ force: true });

    // check if border radius is changed on button
    cy.get(commonlocators.themeAppBorderRadiusBtn)
      .eq(1)
      .invoke("css", "border-top-left-radius")
      .then((borderRadius) => {
        cy.get(widgetsPage.widgetBtn).should(
          "have.css",
          "border-radius",
          borderRadius,
        );

        // publish the app
        // _.deployMode.DeployApp();
        cy.get(widgetsPage.widgetBtn).should(
          "have.css",
          "border-radius",
          borderRadius,
        );
      });

    //Change the color://Commenting below since expanded by default
    //cy.contains("Color").click({ force: true });

    //Change the primary color:
    cy.get(widgetsPage.colorPickerV2Popover).click({ force: true }).click();
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
    cy.get("[data-testid='theme-backgroundColor']").click({ force: true });
    cy.wait(500);
    cy.get(widgetsPage.colorPickerV2Popover).click({ force: true }).click();
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

    // Change the shadow
    cy.get("[data-value='M']").eq(1).click({ force: true });
    cy.get("[data-value='M']")
      .eq(1)
      .invoke("css", "box-shadow")
      .then((boxShadow) => {
        cy.get(containerShadowElement).should(
          "have.css",
          "box-shadow",
          boxShadow,
        );
      });

    //Change the font //Commenting below since expanded by default
    //cy.contains("Font").click({ force: true });

    cy.get(".rc-select-selection-search-input").then(($elem) => {
      cy.get($elem).click({ force: true });
      cy.wait(250);
      cy.get(".rc-virtual-list-holder div")
        .children()
        .eq(2)
        .then(($childElem) => {
          cy.get($childElem).click({ force: true });
          cy.get(widgetsPage.widgetBtn).should(
            "have.css",
            "font-family",
            `${$childElem.children().last().text()}"Nunito Sans", sans-serif`,
          );
        });
    });
  });

  it("3. Checks if the theme can be saved", () => {
    //Click on dropDown elipses
    cy.contains("Theme properties")
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
    cy.get("button[type='submit']").click({ force: true });

    cy.wait(200);
    cy.get(commonlocators.toastMsg).contains("Theme testtheme saved");
    _.appSettings.ClosePane();
  });

  it("4. Verify Save Theme after changing all properties & widgets conform to the selected theme", () => {
    _.entityExplorer.NavigateToSwitcher("Widgets");
    cy.dragAndDropToCanvas("iconbuttonwidget", { x: 200, y: 300 });
    cy.assertPageSave();
    cy.get("canvas").first(0).trigger("click", { force: true });

    _.appSettings.OpenAppSettings();
    _.appSettings.GoToThemeSettings();
    //#region Change Font & verify widgets:
    // cy.contains("Font")
    //   .click({ force: true })
    //   .wait(200);//Commenting below since expanded by default
    cy.get(".rc-select-selection-search-input").then(($elem) => {
      cy.get($elem).click({ force: true });
      cy.wait(250);
      cy.get(".rc-virtual-list-holder div")
        .children()
        .eq(4)
        .then(($childElem) => {
          cy.get($childElem).click({ force: true });
          cy.get(widgetsPage.iconWidgetBtn).should(
            "have.css",
            "font-family",
            `${$childElem.children().last().text()}Inter, sans-serif`,
          );
          cy.get(widgetsPage.widgetBtn).should(
            "have.css",
            "font-family",
            `${$childElem.children().last().text()}Inter, sans-serif`,
          );
        });
    });

    //#endregion

    //#region Change Color & verify widgets:
    //Change the primary color:
    // cy.contains("Color")
    //   .click({ force: true })
    //   .wait(200);
    cy.get(widgetsPage.colorPickerV2Popover).click({ force: true }).click();
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
    cy.get("[data-testid='theme-backgroundColor']").click({ force: true });
    cy.wait(500);
    cy.get(widgetsPage.colorPickerV2Popover).click({ force: true }).click();
    cy.get(widgetsPage.colorPickerV2TailwindColor)
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
    cy.get(commonlocators.themeAppBorderRadiusBtn).eq(2).click({ force: true });
    cy.get(`${commonlocators.themeAppBorderRadiusBtn}`)
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
    cy.get("[data-value='L']").eq(1).click({ force: true });
    cy.get("[data-value='L']")
      .eq(1)
      .invoke("css", "box-shadow")
      .then((boxShadow) => {
        cy.get(containerShadowElement).should(
          "have.css",
          "box-shadow",
          boxShadow,
        );
      });

    //#endregion

    //#region Click on dropDown elipses
    cy.contains("Theme properties")
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
    cy.get(".ads-v2-modal__content-header-close-button").click();

    //Click on save theme dropdown option & cancel it
    cy.contains("Theme properties")
      .closest("div")
      .siblings()
      .first()
      .find("button")
      .click({ force: true });
    cy.wait(300);
    cy.contains("Save theme").click({ force: true });
    cy.wait(200);
    cy.xpath("//span[text()='Cancel']/parent::div").click();

    //Click on save theme dropdown option, give duplicte name & save it
    cy.contains("Theme properties")
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

    cy.get("input[placeholder='My theme']").clear().type("VioletYellowTheme");

    //Click on save theme button
    cy.xpath("//span[text()='Save theme']/parent::div").click({ force: true });

    cy.wait(200);
    cy.get(commonlocators.toastMsg).contains("Theme VioletYellowTheme saved");
  });

  it("5. Verify Themes exists under respective section when ChangeTheme button is cicked in properties with Apply Theme & Trash as applicable", () => {
    //Click on change theme:
    cy.get(commonlocators.changeThemeBtn).click({ force: true });
    cy.xpath(applyTheme("Your themes", "testtheme"))
      .click({ force: true })
      .wait(1000); //Changing to testtheme

    cy.contains("Applied theme")
      .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > main")
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(131, 24, 67)");
      });

    //Check if the saved theme is present under 'Yours Themes' section with Trash button
    cy.xpath(applyTheme("Your themes", "testtheme")).should("exist");
    cy.xpath(themesDeletebtn("Your themes", "testtheme")).should("exist");

    cy.xpath(applyTheme("Your themes", "VioletYellowTheme")).should("exist");
    cy.xpath(themesDeletebtn("Your themes", "VioletYellowTheme")).should(
      "exist",
    );

    cy.xpath(applyTheme("Featured themes", "Earth")).should("exist");
    cy.xpath(themesDeletebtn("Featured themes", "Earth")).should("not.exist");

    cy.xpath(applyTheme("Featured themes", "Sunrise")).should("exist");
    cy.xpath(themesDeletebtn("Featured themes", "Sunrise")).should("not.exist");

    cy.xpath(applyTheme("Featured themes", "Pacific")).should("exist");
    cy.xpath(themesDeletebtn("Featured themes", "Pacific")).should("not.exist");

    cy.xpath(applyTheme("Featured themes", "Pampas")).should("exist");
    cy.xpath(themesDeletebtn("Featured themes", "Pampas")).should("not.exist");

    // cy.contains("Featured themes")
    //   .siblings()
    //   .find(".t--theme-card")
    //   .siblings()
    //   .should("contain.text", "Rounded").siblings()
    //   .contains('Apply Theme');
  });

  it("6. Verify the custom theme can be deleted", () => {
    //Check if the saved theme is present under 'Yours Themes' section
    // cy.contains("Your themes")
    //   .siblings()
    //   .find(".t--theme-card")
    //   .parent()
    //   .find("button").eq(0)
    //   .click({ force: true });
    //   cy.wait(200);

    cy.xpath(themesDeletebtn("Your themes", "testtheme"))
      .click({ force: true })
      .wait(200);
    cy.contains(
      "Do you really want to delete this theme? This process cannot be undone.",
    );

    //Click on Delete theme trash icon & close it
    cy.xpath("//*[text()='Are you sure?']/following-sibling::button").click();
    cy.get(commonlocators.toastMsg).should("not.exist");

    //Click on Delete theme trash icon & cancel it
    cy.xpath(themesDeletebtn("Your themes", "testtheme"))
      .click({ force: true })
      .wait(200);
    cy.xpath("//span[text()='No']/parent::div").click();
    cy.get(commonlocators.toastMsg).should("not.exist");

    //Click on Delete theme trash icon & delete it
    cy.xpath(themesDeletebtn("Your themes", "testtheme"))
      .click({ force: true })
      .wait(200);
    cy.contains("Delete").click({ force: true });

    //check for delete alert
    cy.wait(500);
    cy.get(commonlocators.toastMsg).contains("Theme testtheme deleted");
    cy.xpath(applyTheme("Your themes", "testtheme")).should("not.exist");
  });

  it("7. Verify user able to change between saved theme & already existing Featured themes", () => {
    //#region Pampas
    cy.xpath(applyTheme("Featured themes", "Pampas"))
      .click({ force: true })
      .wait(1000); //Changing to one of Featured themes
    cy.contains("Applied theme")
      // .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(0)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(5, 150, 105)");
      });

    cy.contains("Applied theme")
      // .click()
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
    cy.xpath(applyTheme("Featured themes", "Classic"))
      .click({ force: true })
      .wait(1000); //Changing to one of Featured themes
    cy.contains("Applied theme")
      // .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(0)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(22, 163, 74)");
      });

    cy.contains("Applied theme")
      // .click()
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
    cy.xpath(applyTheme("Featured themes", "Modern"))
      .click({ force: true })
      .wait(1000); //Changing to one of Featured themes
    cy.contains("Applied theme")
      // .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(0)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(85, 61, 233)");
      });

    cy.contains("Applied theme")
      // .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(1)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(248, 250, 252)");
      });

    //#endregion

    //#region Sunrise
    cy.xpath(applyTheme("Featured themes", "Sunrise"))
      .click({ force: true })
      .wait(1000); //Changing to one of Featured themes
    cy.contains("Applied theme")
      // .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(0)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(239, 68, 68)");
      });

    cy.contains("Applied theme")
      // .click()
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
    cy.xpath(applyTheme("Featured themes", "Water Lily"))
      .click({ force: true })
      .wait(1000); //Changing to one of Featured themes
    cy.contains("Applied theme")
      // .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(0)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(219, 39, 119)");
      });

    cy.contains("Applied theme")
      // .click()
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
    cy.xpath(applyTheme("Featured themes", "Pacific"))
      .click({ force: true })
      .wait(1000); //Changing to one of Featured themes
    cy.contains("Applied theme")
      // .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(0)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(8, 145, 178)");
      });

    cy.contains("Applied theme")
      // .click()
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
    cy.xpath(applyTheme("Featured themes", "Earth"))
      .click({ force: true })
      .wait(1000); //Changing to one of Featured themes
    cy.contains("Applied theme")
      // .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(0)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(59, 130, 246)");
      });

    cy.contains("Applied theme")
      // .click()
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
    cy.xpath(applyTheme("Featured themes", "Moon"))
      .click({ force: true })
      .wait(1000); //Changing to one of Featured themes
    cy.contains("Applied theme")
      // .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(0)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(100, 116, 139)");
      });

    cy.contains("Applied theme")
      // .click()
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
    cy.xpath(applyTheme("Your themes", "VioletYellowTheme"))
      .click({ force: true })
      .wait(1000); //Changing to created test theme

    cy.contains("Applied theme")
      // .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(0)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        expect(backgroudColor).to.eq("rgb(126, 34, 206)");
      });

    cy.contains("Applied theme")
      // .click()
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
    _.deployMode.DeployApp();

    //cy.wait(4000); //for theme to settle

    cy.get("body").should("have.css", "font-family", "Inter, sans-serif"); //Font

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

    _.deployMode.NavigateBacktoEditor();
  });

  it("9. Verify Adding new Individual widgets & it can change Color, Border radius, Shadow & can revert [Color/Border Radius] to already selected theme", () => {
    _.entityExplorer.NavigateToSwitcher("Widgets");
    cy.dragAndDropToCanvas("buttonwidget", { x: 200, y: 400 }); //another button widget
    cy.assertPageSave();
    cy.moveToStyleTab();
    //Change Color & verify
    cy.get(widgetsPage.colorPickerV2Popover).click({ force: true }).click();
    cy.get(widgetsPage.colorPickerV2TailwindColor)
      .eq(33)
      .then(($elem) => {
        cy.get($elem).click({ force: true });
        cy.get(".t--widget-button2 button").should(
          "have.css",
          "background-color",
          $elem.css("background-color"), //rgb(134, 239, 172)
        ); //new widget with its own color

        cy.get(".t--widget-button1 button").should(
          "have.css",
          "background-color",
          "rgb(126, 34, 206)",
        ); //old widgets still conforming to theme color
        cy.get(widgetsPage.iconWidgetBtn).should(
          "have.css",
          "background-color",
          "rgb(126, 34, 206)",
        );
      });

    //Change Border & verify

    cy.get(".border-t-2").eq(0).click();
    cy.get(".border-t-2")
      .eq(0)
      .invoke("css", "border-top-left-radius")
      .then((borderRadius) => {
        cy.get(".t--widget-button2 button").should(
          "have.css",
          "border-radius",
          borderRadius, //0px
        );
        cy.get(widgetsPage.iconWidgetBtn).should(
          "have.css",
          "border-radius",
          "24px",
        );
        cy.get(".t--widget-button1 button").should(
          "have.css",
          "border-radius",
          "24px",
        );
      });

    //Change Shadow & verify
    cy.contains(".ads-v2-segmented-control-value-0", "Large").click();

    cy.get(widgetsPage.iconWidgetBtn).should("have.css", "box-shadow", "none");
    cy.get(".t--widget-button1 button").should(
      "have.css",
      "box-shadow",
      "none",
    );

    cy.assertPageSave();
    cy.wait(2000);
    _.deployMode.DeployApp();

    //Verify Background color
    cy.get(".t--widget-buttonwidget:nth-child(4) button").should(
      "have.css",
      "background-color",
      "rgb(134, 239, 172)", //rgb(134, 239, 172)
    ); //new widget with its own color

    ////old widgets still conforming to theme color
    cy.get(".t--widget-buttonwidget button").should(
      "have.css",
      "background-color",
      "rgb(126, 34, 206)",
    );

    cy.get(publish.iconWidgetBtn).should(
      "have.css",
      "background-color",
      "rgb(126, 34, 206)",
    );

    //Verify Border radius
    cy.get(".t--widget-button2 button").should(
      "have.css",
      "border-radius",
      "0px",
    );
    cy.get(publish.iconWidgetBtn).should("have.css", "border-radius", "24px");
    cy.get(".t--widget-button1 button").should(
      "have.css",
      "border-radius",
      "24px",
    );

    //Verify Box shadow
    cy.get(".t--widget-button2 button").should(
      "have.css",
      "box-shadow",
      "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
    );
    cy.get(publish.iconWidgetBtn).should("have.css", "box-shadow", "none");
    cy.get(".t--widget-button1 button").should(
      "have.css",
      "box-shadow",
      "none",
    );

    _.deployMode.NavigateBacktoEditor();
    //Resetting back to theme
    _.entityExplorer.NavigateToSwitcher("Explorer");
    _.entityExplorer.ExpandCollapseEntity("Widgets"); //to expand widgets
    _.entityExplorer.SelectEntityByName("Button2");
    cy.moveToStyleTab();
    cy.get(".t--property-control-buttoncolor .reset-button").then(($elem) => {
      $elem[0].removeAttribute("display: none");
      $elem[0].click();
    });

    cy.get(".t--widget-button2 button").should(
      "have.css",
      "background-color",
      "rgb(126, 34, 206)",
    ); //verify widget reverted to theme color
    cy.get(".t--property-control-borderradius .reset-button").then(($elem) => {
      $elem[0].removeAttribute("display: none");
      $elem[0].click();
    });
    cy.get(".t--widget-button2 button").should(
      "have.css",
      "border-radius",
      "24px",
    );

    //the new widget with reverted styles also conforming to theme
    _.deployMode.DeployApp();

    cy.wait(4000); //for theme to settle
    cy.get("body").should("have.css", "font-family", "Inter, sans-serif"); //Font

    cy.xpath("//div[@id='root']//section/parent::div").should(
      "have.css",
      "background-color",
      "rgb(253, 224, 71)",
    ); //Background Color
    cy.get(".t--widget-button1 button").should(
      "have.css",
      "background-color",
      "rgb(126, 34, 206)",
    ); //Widget Color
    cy.get("body").then(($ele) => {
      if ($ele.find(widgetsPage.widgetBtn).length <= 1) {
        cy.reload();
        cy.wait(4000);
      }
    });
    cy.get(".t--widget-button2 button").should(
      "have.css",
      "background-color",
      "rgb(126, 34, 206)",
    ); //Widget Color
    cy.get(publish.iconWidgetBtn).should(
      "have.css",
      "background-color",
      "rgb(126, 34, 206)",
    ); //Widget Color

    cy.get(".t--widget-button1 button").should(
      "have.css",
      "border-radius",
      "24px",
    ); //Border Radius
    cy.get(".t--widget-button2 button").should(
      "have.css",
      "border-radius",
      "24px",
    ); //Border Radius
    cy.get(publish.iconWidgetBtn).should("have.css", "border-radius", "24px"); //Border Radius

    cy.get(".t--widget-button1 button").should(
      "have.css",
      "box-shadow",
      "none",
    ); //Shadow
    cy.get(".t--widget-button2 button").should(
      "have.css",
      "box-shadow",
      "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
    ); //Since Shadow revert option does not exixts
    cy.get(publish.iconWidgetBtn).should("have.css", "box-shadow", "none"); //Shadow

    _.deployMode.NavigateBacktoEditor();
  });

  it("10. Verify Chainging theme should not affect Individual widgets with changed Color, Border radius, Shadow & can revert to newly selected theme", () => {
    cy.get("canvas").first(0).trigger("click", { force: true });

    _.appSettings.OpenAppSettings();
    _.appSettings.GoToThemeSettings();

    cy.get(commonlocators.changeThemeBtn).click({ force: true });

    //Changing to one of Featured themes & then changing individual widget properties
    cy.xpath(applyTheme("Featured themes", "Sunrise"))
      .click({ force: true })
      .wait(2000);

    //Change individual widget properties for Button1
    _.entityExplorer.NavigateToSwitcher("Explorer");
    _.entityExplorer.ExpandCollapseEntity("Widgets"); //to expand widgets
    _.entityExplorer.SelectEntityByName("Button1");
    cy.moveToStyleTab();

    //Change Color & verify
    cy.get(widgetsPage.colorPickerV2Popover).click({ force: true }).click();
    cy.get(widgetsPage.colorPickerV2TailwindColor)
      .eq(13)
      .then(($elem) => {
        cy.get($elem).click({ force: true });
        cy.get(".t--widget-button1 button").should(
          "have.css",
          "background-color",
          $elem.css("background-color"),
        ); //new widget with its own color

        cy.get(".t--widget-button2 button").should(
          "have.css",
          "background-color",
          "rgb(239, 68, 68)",
        ); //old widgets still conforming to theme color
        cy.get(widgetsPage.iconWidgetBtn).should(
          "have.css",
          "background-color",
          "rgb(239, 68, 68)",
        );
      });

    //Change Border & verify

    cy.get(".border-t-2").eq(1).click().wait(500);
    cy.get(".border-t-2")
      .eq(1)
      .invoke("css", "border-top-left-radius")
      .then((borderRadius) => {
        cy.get(".t--widget-button1 button").should(
          "have.css",
          "border-radius",
          borderRadius, //6px
        );
        cy.get(widgetsPage.iconWidgetBtn).should(
          "have.css",
          "border-radius",
          "24px",
        );
        cy.get(".t--widget-button2 button").should(
          "have.css",
          "border-radius",
          "24px",
        );
      });

    //Change Shadow & verify
    cy.contains(".ads-v2-segmented-control-value-0", "Small").click();
    cy.get(widgetsPage.iconWidgetBtn).should("have.css", "box-shadow", "none");
    cy.get(".t--widget-button2 button").should(
      "have.css",
      "box-shadow",
      //same value as previous box shadow selection
      //since revertion is not possible for box shadow - hence this widget maintains the same value
      "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
    );

    cy.assertPageSave();

    //Add deploy mode verification here also!
    _.deployMode.DeployApp();

    //Verify Background color
    cy.get(".t--widget-button1 button").should(
      "have.css",
      "background-color",
      "rgb(252, 165, 165)",
    ); //new widget with its own color

    ////old widgets still conforming to theme color
    cy.get(".t--widget-button2 button").should(
      "have.css",
      "background-color",
      "rgb(239, 68, 68)",
    );
    cy.get(publish.iconWidgetBtn).should(
      "have.css",
      "background-color",
      "rgb(239, 68, 68)",
    );

    //Verify Border radius
    cy.get(".t--widget-button1 button").should(
      "have.css",
      "border-radius",
      "6px",
    );
    cy.get(publish.iconWidgetBtn).should("have.css", "border-radius", "24px");
    cy.get(".t--widget-button2 button").should(
      "have.css",
      "border-radius",
      "24px",
    );

    //Verify Box shadow
    cy.get(".t--widget-button1 button").should(
      "have.css",
      "box-shadow",
      "rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 1px 2px 0px",
    );
    cy.get(publish.iconWidgetBtn).should("have.css", "box-shadow", "none");
    cy.get(".t--widget-button2 button").should(
      "have.css",
      "box-shadow",
      "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
    );

    _.deployMode.NavigateBacktoEditor();
    //Resetting back to theme
    _.entityExplorer.NavigateToSwitcher("Explorer");
    _.entityExplorer.ExpandCollapseEntity("Widgets"); //to expand widgets
    _.entityExplorer.SelectEntityByName("Button1");
    cy.moveToStyleTab();
    cy.get(".t--property-control-buttoncolor .reset-button").then(($elem) => {
      $elem[0].removeAttribute("display: none");
      $elem[0].click();
    });

    cy.get(".t--widget-button1 button").should(
      "have.css",
      "background-color",
      "rgb(239, 68, 68)",
    ); //verify widget reverted to theme color

    cy.get(".t--property-control-borderradius .reset-button").then(($elem) => {
      $elem[0].removeAttribute("display: none");
      $elem[0].click();
    });
    cy.get(".t--widget-button1 button").should(
      "have.css",
      "border-radius",
      "24px",
    );

    //the new widget with reverted styles also conforming to theme
    _.deployMode.DeployApp();

    cy.wait(4000); //for theme to settle
    cy.get("body").should("have.css", "font-family", "Rubik, sans-serif"); //Font for Rounded theme

    cy.xpath("//div[@id='root']//section/parent::div").should(
      "have.css",
      "background-color",
      "rgb(255, 241, 242)",
    ); //Background Color of canvas

    cy.get(".t--widget-button1 button").should(
      "have.css",
      "background-color",
      "rgb(239, 68, 68)",
    ); //Widget Color
    cy.get("body").then(($ele) => {
      if ($ele.find(widgetsPage.widgetBtn).length <= 1) {
        cy.reload();
        cy.wait(4000);
      }
    });
    cy.get(".t--widget-button2 button").should(
      "have.css",
      "background-color",
      "rgb(239, 68, 68)",
    ); //Widget Color
    cy.get(publish.iconWidgetBtn).should(
      "have.css",
      "background-color",
      "rgb(239, 68, 68)",
    ); //Widget Color

    cy.get(".t--widget-button1 button").should(
      "have.css",
      "border-radius",
      "24px",
    ); //Border Radius
    cy.get(".t--widget-button2 button").should(
      "have.css",
      "border-radius",
      "24px",
    ); //Border Radius
    cy.get(publish.iconWidgetBtn).should("have.css", "border-radius", "24px"); //Border Radius

    cy.get(".t--widget-button1 button").should(
      "have.css",
      "box-shadow",
      "rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 1px 2px 0px",
    ); //Shadow
    cy.get(".t--widget-button2 button").should(
      "have.css",
      "box-shadow",
      "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
    ); //Since Shadow revert option does not exixts
    cy.get(publish.iconWidgetBtn).should("have.css", "box-shadow", "none"); //Shadow

    _.deployMode.NavigateBacktoEditor();
  });
});
