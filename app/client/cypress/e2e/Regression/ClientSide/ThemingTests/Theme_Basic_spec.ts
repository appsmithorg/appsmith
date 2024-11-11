import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
import {
  agHelper,
  appSettings,
  deployMode,
} from "../../../../support/Objects/ObjectsCore";

const containerShadowElement = `${widgetsPage.containerWidget}`;

describe(
  "App Theming funtionality",
  { tags: ["@tag.Theme", "@tag.Git"] },
  function () {
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
      appSettings.OpenAppSettings();
      appSettings.GoToThemeSettings();
      cy.get(commonlocators.changeThemeBtn).click({ force: true });
      agHelper.AssertAutoSave();
      // select a theme
      cy.get(commonlocators.themeCard).last().click({ force: true });
      agHelper.AssertAutoSave();
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
      appSettings.ClosePane();

      // drop a button & container widget and click on body
      cy.dragAndDropToCanvas("buttonwidget", { x: 100, y: 100 });
      cy.dragAndDropToCanvas("containerwidget", { x: 200, y: 200 });
      cy.get("canvas").first(0).trigger("click", { force: true });

      appSettings.OpenAppSettings();
      appSettings.GoToThemeSettings();

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
      agHelper.AssertAutoSave();
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
          // deployMode.DeployApp();
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
      //cy.get("[data-testid='theme-backgroundColor']").click({ force: true });
      agHelper.GetNClick("[data-testid='theme-backgroundColor']");
      agHelper.AssertAutoSave();

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

      agHelper.GetNClick(".rc-select-selection-search-input").then(($elem) => {
        agHelper.GetNClick($elem);
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

    it("4. Verify user able to change between saved theme & already existing Featured themes", () => {
      cy.get(commonlocators.changeThemeBtn).click({ force: true });

      //#region Pampas
      cy.xpath(applyTheme("Featured themes", "Pampas"))
        .click({ force: true })
        .wait(1000); //Changing to one of Featured themes
      cy.contains("Applied theme")
        .click()
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
    });

    it("5. Verify widgets conform to the selected theme in Publish mode", () => {
      deployMode.DeployApp();

      //cy.wait(4000); //for theme to settle

      cy.get("body").should(
        "have.css",
        "font-family",
        `"Nunito Sans", sans-serif`,
      ); //Font

      cy.xpath("//div[@id='root']//section/parent::div").should(
        "have.css",
        "background-color",
        "rgb(248, 250, 252)",
      ); //Background Color
      cy.get(widgetsPage.widgetBtn).should(
        "have.css",
        "background-color",
        "rgb(100, 116, 139)",
      ); //Widget Color

      cy.get(widgetsPage.widgetBtn).should("have.css", "border-radius", "0px"); //Border Radius

      cy.get(widgetsPage.widgetBtn).should("have.css", "box-shadow", "none"); //Shadow

      deployMode.NavigateBacktoEditor();
    });

    it("6. Verify Adding new Individual widgets & it can change Color, Border radius, Shadow & can revert [Color/Border Radius] to already selected theme", () => {
      cy.dragAndDropToCanvas("buttonwidget", { x: 200, y: 400 }); //another button widget
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
            "rgb(100, 116, 139)",
          ); //old widgets still conforming to theme color
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
          cy.get(".t--widget-button1 button").should(
            "have.css",
            "border-radius",
            "0px",
          );
        });

      //Change Shadow & verify
      cy.contains(".ads-v2-segmented-control-value-0", "Large").click();

      cy.get(".t--widget-button1 button").should(
        "have.css",
        "box-shadow",
        "none",
      );

      agHelper.AssertAutoSave();
      deployMode.DeployApp();

      //Verify Background color
      cy.get(".t--widget-button2 button").should(
        "have.css",
        "background-color",
        "rgb(190, 24, 93)",
      ); //new widget with its own color

      ////old widgets still conforming to theme color
      cy.get(".t--widget-button1 button").should(
        "have.css",
        "background-color",
        "rgb(100, 116, 139)",
      );

      //Verify Border radius
      cy.get(".t--widget-button2 button").should(
        "have.css",
        "border-radius",
        "0px",
      );
      cy.get(".t--widget-button1 button").should(
        "have.css",
        "border-radius",
        "0px",
      );

      //Verify Box shadow
      cy.get(".t--widget-button2 button").should(
        "have.css",
        "box-shadow",
        "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
      );
      cy.get(".t--widget-button1 button").should(
        "have.css",
        "box-shadow",
        "none",
      );

      deployMode.NavigateBacktoEditor();
      //Resetting back to theme
      EditorNavigation.SelectEntityByName("Button2", EntityType.Widget);
      cy.moveToStyleTab();
      cy.get(".t--property-control-buttoncolor .reset-button").then(($elem) => {
        $elem[0].removeAttribute("display: none");
        $elem[0].click();
      });

      cy.get(".t--widget-button2 button").should(
        "have.css",
        "background-color",
        "rgb(100, 116, 139)",
      ); //verify widget reverted to theme color
      cy.get(".t--property-control-borderradius .reset-button").then(
        ($elem) => {
          $elem[0].removeAttribute("display: none");
          $elem[0].click();
        },
      );
      cy.get(".t--widget-button2 button").should(
        "have.css",
        "border-radius",
        "0px",
      );

      //the new widget with reverted styles also conforming to theme
      deployMode.DeployApp();

      cy.wait(4000); //for theme to settle
      cy.get("body").should(
        "have.css",
        "font-family",
        `"Nunito Sans", sans-serif`,
      ); //Font

      cy.xpath("//div[@id='root']//section/parent::div").should(
        "have.css",
        "background-color",
        "rgb(248, 250, 252)",
      ); //Background Color
      cy.get(".t--widget-button1 button").should(
        "have.css",
        "background-color",
        "rgb(100, 116, 139)",
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
        "rgb(100, 116, 139)",
      ); //Widget Color

      cy.get(".t--widget-button1 button").should(
        "have.css",
        "border-radius",
        "0px",
      ); //Border Radius
      cy.get(".t--widget-button2 button").should(
        "have.css",
        "border-radius",
        "0px",
      ); //Border Radius

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
      deployMode.NavigateBacktoEditor();
    });

    it("7. Verify Chainging theme should not affect Individual widgets with changed Color, Border radius, Shadow & can revert to newly selected theme", () => {
      cy.get("canvas").first(0).trigger("click", { force: true });

      appSettings.OpenAppSettings();
      appSettings.GoToThemeSettings();

      cy.get(commonlocators.changeThemeBtn).click({ force: true });

      //Changing to one of Featured themes & then changing individual widget properties
      cy.xpath(applyTheme("Featured themes", "Sunrise"))
        .click({ force: true })
        .wait(2000);

      //Change individual widget properties for Button1
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
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

          cy.get(".t--widget-button2 button").should(
            "have.css",
            "border-radius",
            "24px",
          );
        });

      //Change Shadow & verify
      cy.contains(".ads-v2-segmented-control-value-0", "Small").click();
      cy.get(".t--widget-button2 button").should(
        "have.css",
        "box-shadow",
        //same value as previous box shadow selection
        //since revertion is not possible for box shadow - hence this widget maintains the same value
        "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
      );

      agHelper.AssertAutoSave();

      //Add deploy mode verification here also!
      deployMode.DeployApp();

      //Verify Background color
      cy.get(".t--widget-button1 button").should(
        "have.css",
        "background-color",
        "rgb(161, 98, 7)",
      ); //new widget with its own color

      ////old widgets still conforming to theme color
      cy.get(".t--widget-button2 button").should(
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
      cy.get(".t--widget-button2 button").should(
        "have.css",
        "box-shadow",
        "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
      );

      deployMode.NavigateBacktoEditor();
      //Resetting back to theme
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
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

      cy.get(".t--property-control-borderradius .reset-button").then(
        ($elem) => {
          $elem[0].removeAttribute("display: none");
          $elem[0].click();
        },
      );
      cy.get(".t--widget-button1 button").should(
        "have.css",
        "border-radius",
        "24px",
      );

      //the new widget with reverted styles also conforming to theme
      deployMode.DeployApp();

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

      deployMode.NavigateBacktoEditor();
    });
  },
);
