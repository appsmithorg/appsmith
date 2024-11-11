/// <reference types="Cypress" />

import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const widgetsPage = require("../../../../locators/Widgets.json");
import homePage from "../../../../locators/HomePage";
import {
  agHelper,
  homePage as homePageHelpers,
  table,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Migration Validate",
  { tags: ["@tag.ImportExport", "@tag.Git"] },
  function () {
    it("1. Import application and Validate Migration on pageload", function () {
      // import application
      homePageHelpers.NavigateToHome();
      agHelper.GetNClick(homePage.createNew, 0);
      cy.get(homePage.workspaceImportAppOption).click({ force: true });
      cy.get(homePage.workspaceImportAppModal).should("be.visible");
      cy.xpath(homePage.uploadLogo)
        .selectFile("cypress/fixtures/TableMigrationAppExported.json", {
          force: true,
        })
        .wait(500);
      cy.get(homePage.workspaceImportAppModal).should("not.exist");

      cy.wait("@importNewApplication").then(() => {
        cy.get(homePage.toastMessage).should(
          "contain",
          Cypress.env("MESSAGES").IMPORT_APP_SUCCESSFUL(),
        );

        //Renaming imported app!
        const uuid = () => Cypress._.random(0, 1e4);
        const name = uuid();
        homePageHelpers.RenameApplication(`app${name}`);
        cy.wrap(`app${name}`).as("appname");

        // Validating data binding for the imported application - Page1

        //Validating order of header row!
        cy.xpath(
          "//div[@class='tableWrap']//div[@class='thead']//div[@class='tr'][1]",
        )
          .invoke("text")
          .then((x) => {
            expect(x).to.eq(
              "Card NumberidNameاسمaddress住所PhoneemailCompanyjobimagessnPin CodeCreditLimitOutstandingStateAvailable LimitCard TypeChange Credit limitimageURLlatitudelongitude",
            );
            cy.log("header set is:" + x);
          });

        //Validating Latitude & Longitude are hidden columns:
        cy.xpath(
          "//div[@class='tableWrap']//div[@class='thead']//div[@class='tr'][1]//div[@role='columnheader']//span[text()='latitude']/parent::div/parent::div/parent::div",
        )
          .invoke("attr", "class")
          .then((classes) => {
            cy.log("classes are:" + classes);
            expect(classes).includes("hidden-header");
          });

        cy.xpath(
          "//div[@class='tableWrap']//div[@class='thead']//div[@class='tr'][1]//div[@role='columnheader']//span[text()='longitude']/parent::div/parent::div/parent::div",
        )
          .invoke("attr", "class")
          .then((classes) => {
            cy.log("classes are:" + classes);
            expect(classes).includes("hidden-header");
          });

        //Validating Id column sorting happens as Datatype is Number in app!
        cy.xpath(
          "//div[@class='tableWrap']//div[@class='thead']//div[@class='tr'][1]//div[@role='columnheader']//span[text()='id']",
        )
          .click()
          .wait(2000);

        cy.readTabledataPublish("0", "1").then((cellData) => {
          expect(cellData).to.be.equal("100");
        });

        cy.readTabledataPublish("1", "1").then((cellData) => {
          expect(cellData).to.be.equal("99");
        });

        cy.readTabledataPublish("2", "1").then((cellData) => {
          expect(cellData).to.be.equal("98");
        });

        //Revert the Id column sorting!
        cy.xpath(
          "//div[@class='tableWrap']//div[@class='thead']//div[@class='tr'][1]//div[@role='columnheader']//span[text()='id']",
        )
          .click()
          .wait(2000);

        cy.readTabledataPublish("0", "1").then((cellData) => {
          expect(cellData).to.be.equal("1");
        });

        cy.readTabledataPublish("1", "1").then((cellData) => {
          expect(cellData).to.be.equal("2");
        });

        cy.readTabledataPublish("2", "1").then((cellData) => {
          expect(cellData).to.be.equal("3");
        });

        //Validating image column is present:
        cy.getTableDataSelector("0", "10").then((selector) => {
          cy.get(selector + " div")
            .invoke("attr", "class")
            .then((classes) => {
              cy.log("classes are:" + classes);
              expect(classes).to.eq("image-cell");
            });
        });

        //Card Number mapping to text widget!
        table.SelectTableRow(2);
        cy.wait(2500); //time for table row select to reflect!
        cy.readTabledataPublish("2", "0").then((cardNumber) => {
          cy.xpath("//div[contains(@class, ' t--widget-textwidget')][1]")
            .eq(1)
            .invoke("text")
            .then((cardNo) => {
              let format = /^\d{4}-\d{4}-\d{4}(-\d{4})?$/;
              expect(cardNumber).match(format);
              expect(cardNumber).to.be.equal(cardNo);
            });
        });

        //Address mapping to text widget!
        cy.readTabledataPublish("2", "4").then((address) => {
          cy.xpath("//div[contains(@class, ' t--widget-textwidget')][2]")
            .eq(1)
            .invoke("text")
            .then((addr) => {
              expect(address.replace(/\r?\n|\r/, "")).to.eq(addr);
            });
        });

        //Validating Available limit column computation maintained!
        cy.readTabledataPublish("2", "16").then((availLimit) => {
          cy.readTabledataPublish("2", "13").then((creditLimit) => {
            cy.readTabledataPublish("2", "14").then((outstanding) => {
              expect(Number(availLimit)).to.eq(creditLimit - outstanding);
            });
          });
        });

        //Validating State button click & binding & text widget mapping!
        cy.getTableDataSelector("2", "15").then((selector) => {
          cy.get(selector + " button.bp3-button")
            .click()
            .wait(3000);

          cy.waitUntil(
            () =>
              cy
                .xpath("//div[contains(@class, ' t--widget-textwidget')][1]")
                .eq(0)
                .contains("State:", { timeout: 30000 })
                .should("exist"),
            {
              errorMsg: "Execute call did not complete evn after 10 secs",
              timeout: 20000,
              interval: 1000,
            },
          ).then(() => cy.wait(500));

          cy.get(selector + " button span")
            .invoke("text")
            .then((statetxt) => {
              cy.xpath("//div[contains(@class, ' t--widget-textwidget')][1]")
                .eq(0)
                .invoke("text")
                .then((txtWidtxt) => {
                  cy.log("statetxt is:" + statetxt);
                  let text =
                    statetxt == "Activate" ? "State:Inactive" : "State:Active";
                  expect(text).to.eq(txtWidtxt);
                });
            });
        });

        //Validating Image URL click & navigation!
        cy.getTableDataSelector("2", "19").then((selector) => {
          cy.window().then((win) => {
            // Stub `window.open` to prevent new tabs
            cy.stub(win, "open").as("windowOpenStub");
            cy.get(selector + " span").then(($link) => {
              cy.wrap($link).click();
              cy.get("@windowOpenStub").should("have.been.called");
            });
          });
        });

        cy.wait("@getWorkspace");

        cy.waitUntil(() => cy.get("div.tableWrap").should("be.visible"), {
          errorMsg: "Page is not loaded evn after 10 secs",
          timeout: 30000,
          interval: 2000,
        }).then(() => cy.wait(1000)); //wait for page load!

        table.SelectTableRow(2);
        cy.getTableDataSelector("2", "18").then((selector) => {
          cy.get(selector + " button")
            .click()
            .wait(1000);

          cy.xpath(
            "//div//a[contains(@class, 'bp3-menu-item')]/div[text()='AddcreditLimit']/parent::a",
          )
            .click()
            .wait(2000);

          cy.waitUntil(
            () =>
              cy
                .xpath("//div[contains(@class, ' t--widget-textwidget')][2]", {
                  timeout: 50000,
                })
                .eq(0)
                .contains("CreditLimit:", { timeout: 30000 })
                .should("exist"),
            {
              errorMsg: "Execute call did not complete evn after 10 secs",
              timeout: 20000,
              interval: 1000,
            },
          ).then(() => cy.wait(500)); //allow time for n/w to finish

          cy.xpath("//div[contains(@class, ' t--widget-textwidget')][2]", {
            timeout: 30000,
          })
            .eq(0)
            .invoke("text")
            .then((addreduce) => {
              expect(addreduce).to.eq("CreditLimit:Add");
            });
        });

        //Manu Btn validation: - 2nd menu item
        cy.getTableDataSelector("2", "18").then((selector) => {
          cy.get(selector + " button")
            .click()
            .wait(1000);

          cy.xpath(
            "//div//a[contains(@class, 'bp3-menu-item')]/div[text()='Reducecreditlimit']/parent::a",
          )
            .click()
            .wait(2000);

          cy.waitUntil(
            () =>
              cy
                .xpath("//div[contains(@class, ' t--widget-textwidget')][2]", {
                  timeout: 50000,
                })
                .eq(0)
                .contains("CreditLimit:", { timeout: 30000 })
                .should("exist"),
            {
              errorMsg: "Execute call did not complete evn after 10 secs",
              timeout: 20000,
              interval: 1000,
            },
          ).then(() => cy.wait(500)); //allow time for n/w to finish

          cy.xpath("//div[contains(@class, ' t--widget-textwidget')][2]", {
            timeout: 30000,
          })
            .eq(0)
            .invoke("text")
            .then((addreduce) => {
              expect(addreduce).to.eq("CreditLimit:Reduce");
            });
        });
      });

      //Page 2 Validations:
      EditorNavigation.SelectEntityByName(
        "Change color and font",
        EntityType.Page,
      );
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);

      cy.get(widgetsPage.bold)
        .invoke("attr", "data-selected")
        .then((sel) => expect(Boolean(sel)).to.be.true);
      cy.xpath(widgetsPage.textCenterAlign)
        .eq(0)
        .invoke("attr", "data-selected")
        .then((sel) => expect(Boolean(sel)).to.be.true); //Text align
      cy.xpath(widgetsPage.textCenterAlign)
        .eq(1)
        .invoke("attr", "data-selected")
        .then((sel) => expect(Boolean(sel)).to.be.true); //Vertical align
      cy.get(widgetsPage.textColor)
        .first()
        .invoke("attr", "value")
        .should("contain", "#2E3D49");
      cy.get(`${widgetsPage.cellBackground_tablev1} input`)
        .first()
        .invoke("attr", "value")
        .should("contain", "#FFC13D");
      cy.validateCodeEditorContent(".t--property-control-textsize", "1.5rem");
    });
  },
);
