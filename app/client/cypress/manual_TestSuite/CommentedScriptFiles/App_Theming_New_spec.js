// const commonlocators = require("../../../../locators/commonlocators.json");
// const widgetsPage = require("../../../../locators/Widgets.json");
// const explorer = require("../../../../locators/explorerlocators.json");
// const publish = require("../../../../locators/publishWidgetspage.json");
// const dsl = require("../../../../fixtures/replay.json");

// describe("App Theming funtionality", function () {
//   /**
//    * Test cases; Check:
//    * 1. If theme can be changed*
//    * 2. If the theme can edited*
//    * 4. If the save theme can be used.
//    * 5. If the theme can be deleled
//    */
//   before(() => {
//     cy.addDsl(dsl);
//   });

//   let themesSection = (sectionName, themeName) => "//*[text()='" + sectionName + "']/following-sibling::div//*[text()='" + themeName + "']"
//   let applyTheme = (sectionName, themeName) => themesSection(sectionName, themeName) + "/parent::div/following-sibling::div[contains(@class, 't--theme-card')]//div[text()='Apply Theme']"
//   let themesDeletebtn = (sectionName, themeName) => themesSection(sectionName, themeName) + "/following-sibling::button"

//   it("1. Checks if theme can be changed to one of the existing themes", function () {
//     cy.get(commonlocators.changeThemeBtn).click({ force: true });

//     // select a theme
//     cy.get(commonlocators.themeCard)
//       .last()
//       .click({ force: true });

//     // check for alert
//     cy.get(`${commonlocators.themeCard}`)
//       .last()
//       .siblings("div")
//       .first()
//       .invoke("text")
//       .then((text) => {
//         cy.get(commonlocators.toastmsg).contains(`Theme ${text} Applied`);
//       });

//     // check if color of canvas is same as theme bg color
//     cy.get(`${commonlocators.themeCard} > main`)
//       .last()
//       .invoke("css", "background-color")
//       .then((backgroudColor) => {
//         cy.get(commonlocators.canvas).should(
//           "have.css",
//           "background-color",
//           backgroudColor,
//         );
//       });
//   });

//   it("2. Checks if theme can be edited", function () {
//     cy.get(commonlocators.selectThemeBackBtn).click({ force: true });
//     // drop a button widget and click on body
//     cy.get(explorer.addWidget).click();
//     cy.dragAndDropToCanvas("buttonwidget", { x: 200, y: 200 });//iconbuttonwidget
//     cy.assertPageSave();
//     cy.get("canvas")
//       .first(0)
//       .trigger("click", { force: true });

//     //Click the back button
//     //cy.get(commonlocators.selectThemeBackBtn).click({ force: true });

//     //Click the border radius toggle
//     cy.contains("Border")
//       .click({ force: true })
//       .wait(500);

//     // change app border radius
//     cy.get(commonlocators.themeAppBorderRadiusBtn)
//       .eq(1)
//       .click({ force: true });

//     // check if border radius is changed on button
//     cy.get(`${commonlocators.themeAppBorderRadiusBtn} > div`)
//       .eq(1)
//       .invoke("css", "border-top-left-radius")
//       .then((borderRadius) => {
//         cy.get(widgetsPage.widgetBtn).should(
//           "have.css",
//           "border-radius",
//           borderRadius,
//         );

//         // publish the app
//         // cy.PublishtheApp();
//         cy.get(widgetsPage.widgetBtn).should(
//           "have.css",
//           "border-radius",
//           borderRadius,
//         );
//       });

//     //Change the color:
//     cy.contains("Color").click({ force: true });

//     //Change the primary color:
//     cy.get(".border-2")
//       .first()
//       .click({ force: true });
//     cy.wait(500);
//     cy.get(widgetsPage.colorPickerV2Popover)
//       .click({ force: true })
//       .click();
//     cy.get(widgetsPage.colorPickerV2Color)
//       .eq(-3)
//       .then(($elem) => {
//         cy.get($elem).click({ force: true });
//         cy.get(widgetsPage.widgetBtn).should(
//           "have.css",
//           "background-color",
//           $elem.css("background-color"),
//         );
//       });

//     //Change the background color:
//     cy.get(".border-2")
//       .last()
//       .click({ force: true });
//     cy.wait(500);
//     cy.get(widgetsPage.colorPickerV2Popover)
//       .click({ force: true })
//       .click();
//     cy.get(widgetsPage.colorPickerV2Color)
//       .first()
//       .then(($elem) => {
//         cy.get($elem).click({ force: true });
//         cy.get(commonlocators.canvas).should(
//           "have.css",
//           "background-color",
//           $elem.css("background-color"),
//         );
//       });

//     //Change the shadow
//     cy.contains("Shadow").click({ force: true });
//     cy.contains("App Box Shadow")
//       .siblings("div")
//       .children("span")
//       .last()
//       .then(($elem) => {
//         cy.get($elem).click({ force: true });
//         cy.get(widgetsPage.widgetBtn).should(
//           "have.css",
//           "box-shadow",
//           $elem.css("box-shadow"),
//         );
//       });

//     //Change the font
//     cy.contains("Font").click({ force: true });

//     cy.get("span[name='expand-more']").then(($elem) => {
//       cy.get($elem).click({ force: true });
//       cy.wait(250);
//       cy.get(".ads-dropdown-options-wrapper div")
//         .children()
//         .eq(2)
//         .then(($childElem) => {
//           cy.get($childElem).click({ force: true });
//           cy.get(widgetsPage.widgetBtn).should(
//             "have.css",
//             "font-family",
//             $childElem
//               .children()
//               .last()
//               .text(),
//           );
//         });
//     });
//   });

//   it("3. Checks if the theme can be saved", () => {
//     //Click on dropDown elipses
//     cy.contains("Theme Properties")
//       .closest("div")
//       .siblings()
//       .first()
//       .find("button")
//       .click({ force: true });
//     // .then(($elem) => {
//     //   cy.get(`${$elem} button`).click({ force: true });
//     // })

//     cy.wait(300);

//     //Click on save theme dropdown option
//     cy.contains("Save theme").click({ force: true });

//     cy.wait(200);

//     //Type the name of the theme:
//     cy.get("input[placeholder='My theme']").type("testtheme");

//     //Click on save theme button
//     cy.get("a[type='submit']").click({ force: true });

//     cy.wait(200);
//     cy.get(commonlocators.toastMsg).contains("Theme testtheme Applied");
//   });

//   it("4. Verify Save Theme after changing all properties & widgets conform to the selected theme", () => {
//     cy.get(explorer.widgetSwitchId).click();
//     cy.dragAndDropToCanvas("iconbuttonwidget", { x: 200, y: 300 });
//     cy.assertPageSave();
//     cy.get("canvas")
//       .first(0)
//       .trigger("click", { force: true });

//     //#region Change Font & verify widgets:
//     cy.contains("Font")
//       .click({ force: true })
//       .wait(200);
//     cy.get("span[name='expand-more']").then(($elem) => {
//       cy.get($elem).click({ force: true });
//       cy.wait(250);
//       cy.get(".ads-dropdown-options-wrapper div")
//         .children()
//         .eq(4)
//         .then(($childElem) => {
//           cy.get($childElem).click({ force: true });
//           cy.get(widgetsPage.iconWidgetBtn).should(
//             "have.css",
//             "font-family",
//             $childElem
//               .children()
//               .last()
//               .text(),
//           );
//           cy.get(widgetsPage.widgetBtn).should(
//             "have.css",
//             "font-family",
//             $childElem
//               .children()
//               .last()
//               .text(),
//           );
//         });
//     });

//     //#endregion

//     //#region Change Color & verify widgets:
//     //Change the primary color:
//     cy.contains("Color")
//       .click({ force: true })
//       .wait(200);
//     cy.get(".border-2")
//       .first()
//       .click({ force: true });
//     cy.wait(500);
//     cy.get(widgetsPage.colorPickerV2Popover)
//       .click({ force: true })
//       .click();
//     cy.get(widgetsPage.colorPickerV2Color)
//       .eq(-15)
//       .then(($elem) => {
//         cy.get($elem).click({ force: true });
//         cy.get(widgetsPage.iconWidgetBtn).should(
//           "have.css",
//           "background-color",
//           $elem.css("background-color"),
//         );
//         cy.get(widgetsPage.widgetBtn).should(
//           "have.css",
//           "background-color",
//           $elem.css("background-color"),
//         );
//       });

//     //Change the background color:
//     cy.get(".border-2")
//       .last()
//       .click({ force: true });
//     cy.wait(500);
//     cy.get(widgetsPage.colorPickerV2Popover)
//       .click({ force: true })
//       .click();
//     cy.get(widgetsPage.colorPickerV2Color)
//       .eq(23)
//       .then(($elem) => {
//         cy.get($elem).click({ force: true });
//         cy.get(commonlocators.canvas).should(
//           "have.css",
//           "background-color",
//           $elem.css("background-color"),
//         );
//       });

//     //#endregion

//     //#region Change Border radius & verify widgets
//     cy.contains("Border")
//       .click({ force: true })
//       .wait(200);
//     cy.get(commonlocators.themeAppBorderRadiusBtn)
//       .eq(2)
//       .click({ force: true });
//     cy.get(`${commonlocators.themeAppBorderRadiusBtn} > div`)
//       .eq(2)
//       .invoke("css", "border-top-left-radius")
//       .then((borderRadius) => {
//         cy.get(widgetsPage.iconWidgetBtn).should(
//           "have.css",
//           "border-radius",
//           borderRadius,
//         );
//         cy.get(widgetsPage.widgetBtn).should(
//           "have.css",
//           "border-radius",
//           borderRadius,
//         );
//       });

//     //#endregion

//     //#region Change the shadow & verify widgets
//     cy.contains("Shadow").click({ force: true });
//     cy.contains("App Box Shadow")
//       .siblings("div")
//       .children("span")
//       .first()
//       .then(($elem) => {
//         cy.get($elem).click({ force: true });
//         cy.get(widgetsPage.iconWidgetBtn).should(
//           "have.css",
//           "box-shadow",
//           $elem.css("box-shadow"),
//         );
//         cy.get(widgetsPage.widgetBtn).should(
//           "have.css",
//           "box-shadow",
//           $elem.css("box-shadow"),
//         );
//       });

//     //#endregion

//     //#region Click on dropDown elipses
//     cy.contains("Theme Properties")
//       .closest("div")
//       .siblings()
//       .first()
//       .find("button")
//       .click({ force: true });
//     cy.wait(300);
//     //#endregion

//     //Click on save theme dropdown option & close it
//     cy.contains("Save theme").click({ force: true });
//     cy.wait(200);
//     cy.xpath("//*[text()='Save Theme']/following-sibling::button").click()

//     //Click on save theme dropdown option & cancel it
//     cy.contains("Theme Properties")
//       .closest("div")
//       .siblings()
//       .first()
//       .find("button")
//       .click({ force: true });
//     cy.wait(300);
//     cy.contains("Save theme").click({ force: true });
//     cy.wait(200);
//     cy.xpath("//span[text()='Cancel']/parent::a").click()

//     //Click on save theme dropdown option, give duplicte name & save it
//     cy.contains("Theme Properties")
//       .closest("div")
//       .siblings()
//       .first()
//       .find("button")
//       .click({ force: true });
//     cy.wait(300);
//     cy.contains("Save theme").click({ force: true });
//     cy.wait(200);
//     //Type the name of the theme:
//     cy.get("input[placeholder='My theme']").type("testtheme");
//     cy.contains("Name must be unique")

//     cy.get("input[placeholder='My theme']").clear().type("VioletYellowTheme");

//     //Click on save theme button
//     cy.xpath("//span[text()='Save theme']/parent::a").click({ force: true });

//     cy.wait(200);
//     cy.get(commonlocators.toastMsg).contains("Theme VioletYellowTheme Applied");
//   });

//   it("5. Verify Themes exists under respective section in ChangeTheme button in properties with Apply Theme & Trash as applicable", () => {

//     //Click on change theme:
//     cy.get(commonlocators.changeThemeBtn).click({ force: true });
//     cy.xpath(applyTheme("Your Themes", 'testtheme')).click({ force: true }).wait(500) //Changing to testtheme

//     cy.contains("Current Theme").click()
//       .parent()
//       .siblings()
//       .find(".t--theme-card > main > main")
//       .invoke("css", "background-color")
//       .then((backgroudColor) => {
//         expect(backgroudColor).to.eq("rgb(131, 24, 67)")
//       });

//     //Check if the saved theme is present under 'Yours Themes' section with Trash button
//     cy.xpath(applyTheme("Your Themes", 'testtheme')).should('exist')
//     cy.xpath(themesDeletebtn("Your Themes", 'testtheme')).should('exist')

//     cy.xpath(applyTheme("Your Themes", 'VioletYellowTheme')).should('exist')
//     cy.xpath(themesDeletebtn("Your Themes", 'VioletYellowTheme')).should('exist')

//     cy.xpath(applyTheme("Featured Themes", 'Classic')).should('exist')
//     cy.xpath(themesDeletebtn("Featured Themes", 'Classic')).should("not.exist")

//     cy.xpath(applyTheme("Featured Themes", 'Modern')).should('exist')
//     cy.xpath(themesDeletebtn("Featured Themes", 'Modern')).should("not.exist")

//     cy.xpath(applyTheme("Featured Themes", 'Sharp')).should('exist')
//     cy.xpath(themesDeletebtn("Featured Themes", 'Sharp')).should("not.exist")

//     cy.xpath(applyTheme("Featured Themes", 'Rounded')).should('exist')
//     cy.xpath(themesDeletebtn("Featured Themes", 'Rounded')).should("not.exist")

//     // cy.contains("Featured Themes")
//     //   .siblings()
//     //   .find(".t--theme-card")
//     //   .siblings()
//     //   .should("contain.text", "Rounded").siblings()
//     //   .contains('Apply Theme');
//   });

//   it("6. Checks if the theme can be deleted", () => {

//     //Check if the saved theme is present under 'Yours Themes' section
//     // cy.contains("Your Themes")
//     //   .siblings()
//     //   .find(".t--theme-card")
//     //   .parent()
//     //   .find("button").eq(0)
//     //   .click({ force: true });
//     //   cy.wait(200);

//     cy.xpath(themesDeletebtn("Your Themes", 'testtheme')).click().wait(200)
//     cy.contains("Do you really want to delete this theme? This process cannot be undone.")

//     //Click on Delete theme trash icon & close it
//     cy.xpath("//*[text()='Are you sure?']/following-sibling::button").click()
//     cy.get(commonlocators.toastMsg).should('not.exist')

//     //Click on Delete theme trash icon & cancel it
//     cy.xpath(themesDeletebtn("Your Themes", 'testtheme')).click().wait(200)
//     cy.xpath("//span[text()='Cancel']/parent::a").click()
//     cy.get(commonlocators.toastMsg).should('not.exist')

//     //Click on Delete theme trash icon & delete it
//     cy.xpath(themesDeletebtn("Your Themes", 'testtheme')).click().wait(200)
//     cy.contains("Delete").click({ force: true });

//     //check for delete alert
//     cy.wait(500);
//     cy.get(commonlocators.toastMsg).contains("Theme testtheme Deleted");
//     cy.xpath(applyTheme("Your Themes", 'testtheme')).should('not.exist')

//   });

//   it("7. Verify user able to change themes between saved theme & already existing themes", () => {
//     //#region Modern
//     cy.xpath(applyTheme("Featured Themes", 'Modern')).click({ force: true }).wait(500) //Changing to one of featured themes
//     cy.contains("Current Theme").click()
//       .parent()
//       .siblings()
//       .find(".t--theme-card > main > section > div > main")
//       .eq(0)
//       .invoke("css", "background-color")
//       .then((backgroudColor) => {
//         expect(backgroudColor).to.eq("rgb(85, 61, 233)")
//       });

//     cy.contains("Current Theme").click()
//       .parent()
//       .siblings()
//       .find(".t--theme-card > main > section > div > main")
//       .eq(1)
//       .invoke("css", "background-color")
//       .then((backgroudColor) => {
//         expect(backgroudColor).to.eq("rgb(246, 246, 246)")
//       });

//     //#endregion

//     //#region Classic
//     cy.xpath(applyTheme("Featured Themes", 'Classic')).click({ force: true }).wait(500) //Changing to one of featured themes
//     cy.contains("Current Theme").click()
//       .parent()
//       .siblings()
//       .find(".t--theme-card > main > section > div > main")
//       .eq(0)
//       .invoke("css", "background-color")
//       .then((backgroudColor) => {
//         expect(backgroudColor).to.eq("rgb(80, 175, 108)")
//       });

//     cy.contains("Current Theme").click()
//       .parent()
//       .siblings()
//       .find(".t--theme-card > main > section > div > main")
//       .eq(1)
//       .invoke("css", "background-color")
//       .then((backgroudColor) => {
//         expect(backgroudColor).to.eq("rgb(246, 246, 246)")
//       });

//     //#endregion

//     //#region Sharp
//     cy.xpath(applyTheme("Featured Themes", 'Sharp')).click({ force: true }).wait(500) //Changing to one of featured themes
//     cy.contains("Current Theme").click()
//       .parent()
//       .siblings()
//       .find(".t--theme-card > main > section > div > main")
//       .eq(0)
//       .invoke("css", "background-color")
//       .then((backgroudColor) => {
//         expect(backgroudColor).to.eq("rgb(59, 125, 221)")
//       });

//     cy.contains("Current Theme").click()
//       .parent()
//       .siblings()
//       .find(".t--theme-card > main > section > div > main")
//       .eq(1)
//       .invoke("css", "background-color")
//       .then((backgroudColor) => {
//         expect(backgroudColor).to.eq("rgb(255, 255, 255)")
//       });

//     //#endregion

//     //#region Rounded
//     cy.xpath(applyTheme("Featured Themes", 'Rounded')).click({ force: true }).wait(500) //Changing to one of featured themes
//     cy.contains("Current Theme").click()
//       .parent()
//       .siblings()
//       .find(".t--theme-card > main > section > div > main")
//       .eq(0)
//       .invoke("css", "background-color")
//       .then((backgroudColor) => {
//         expect(backgroudColor).to.eq("rgb(222, 21, 147)")
//       });

//     cy.contains("Current Theme").click()
//       .parent()
//       .siblings()
//       .find(".t--theme-card > main > section > div > main")
//       .eq(1)
//       .invoke("css", "background-color")
//       .then((backgroudColor) => {
//         expect(backgroudColor).to.eq("rgb(246, 246, 246)")
//       });
//     //#endregion

//     //#region VioletYellowTheme
//     cy.xpath(applyTheme("Your Themes", 'VioletYellowTheme')).click({ force: true }).wait(500) //Changing to created test theme

//     cy.contains("Current Theme").click()
//       .parent()
//       .siblings()
//       .find(".t--theme-card > main > section > div > main")
//       .eq(0)
//       .invoke("css", "background-color")
//       .then((backgroudColor) => {
//         expect(backgroudColor).to.eq("rgb(126, 34, 206)")
//       });

//     cy.contains("Current Theme").click()
//       .parent()
//       .siblings()
//       .find(".t--theme-card > main > section > div > main")
//       .eq(1)
//       .invoke("css", "background-color")
//       .then((backgroudColor) => {
//         expect(backgroudColor).to.eq("rgb(253, 224, 71)")
//       });

//     //#endregion
//   })

//   it("8. Verify widgets confirm to the selected theme in Publish mode", () => {
//     cy.PublishtheApp();

//     cy.wait(2000)//for theme to settle

//     cy.get('body').should('have.css', "font-family", "Montserrat")//Font

//     cy.xpath("//div[@id='root']//section/parent::div").should('have.css', "background-color", "rgb(253, 224, 71)")//Background Color
//     cy.get(widgetsPage.widgetBtn).should("have.css", "background-color", "rgb(126, 34, 206)");//Widget Color
//     cy.get(publish.iconWidgetBtn).should("have.css", "background-color", "rgb(126, 34, 206)",);//Widget Color

//     cy.get(widgetsPage.widgetBtn).should("have.css", "border-radius", "24px",);//Border Radius
//     cy.get(publish.iconWidgetBtn).should("have.css", "border-radius", "24px",);//Border Radius

//     cy.get(widgetsPage.widgetBtn).should("have.css", "box-shadow", "none");//Shadow
//     cy.get(publish.iconWidgetBtn).should("have.css", "box-shadow", "none");//Shadow

//     //Verify Share button
//     cy.contains('Share').should("have.css", "border-top-color", "rgb(126, 34, 206)")//Color
//     cy.contains('Share').closest('div').should("have.css", "font-family" ,"Montserrat")//Font

//     //Verify Edit App button
//     cy.contains('Edit App').should("have.css", "background-color", "rgb(126, 34, 206)")//Color
//     cy.contains('Edit App').closest('div').should("have.css", "font-family" ,"Montserrat")//Font

//   })

// });
