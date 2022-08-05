/// <reference types="Cypress" />

const widgetsPage = require("../../../../locators/Widgets.json");
import homePage from "../../../../locators/HomePage";

describe("Migration Validate", function() {
  it("1. Import application and Validate Migration on pageload", function() {
    // import application
    cy.get(homePage.homeIcon).click();
    cy.get(homePage.optionsIcon)
      .first()
      .click();
    cy.get(homePage.workspaceImportAppOption).click({ force: true });
    cy.get(homePage.workspaceImportAppModal).should("be.visible");
    cy.xpath(homePage.uploadLogo)
      .attachFile("TableMigrationAppExported.json")
      .wait(500);
    // cy.get(homePage.workspaceImportAppButton)
    //   .trigger("click")
    //   .wait(500);
    cy.get(homePage.workspaceImportAppModal).should("not.exist");

    cy.wait("@importNewApplication").then((interception) => {
      // let appId = interception.response.body.data.id;
      // let defaultPage = interception.response.body.data.pages.find(
      //   (eachPage) => !!eachPage.isDefault,
      // );

      cy.get(homePage.toastMessage).should(
        "contain",
        "Application imported successfully",
      );

      //Renaming imported app!
      const uuid = () => Cypress._.random(0, 1e4);
      const name = uuid();
      cy.wait(2000);
      cy.AppSetupForRename();
      cy.get(homePage.applicationName).type(`app${name}`);
      cy.wrap(`app${name}`).as("appname");
      cy.wait(2000);

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
      cy.isSelectRow(2);
      cy.wait(2500); //time for table row select to reflect!
      cy.readTabledataPublish("2", "0").then((cardNumber) => {
        cy.xpath("//div[contains(@class, ' t--widget-textwidget')][1]")
          .eq(1)
          .invoke("text")
          .then((cardNo) => {
            var format = /^\d{4}-\d{4}-\d{4}(-\d{4})?$/;
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
              .xpath("//div[contains(@class, ' t--widget-textwidget')][2]")
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
            cy.xpath("//div[contains(@class, ' t--widget-textwidget')][2]")
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
        // Stubbing window.open to open in the same tab
        cy.window().then((window) => {
          cy.stub(window, "open").callsFake((url) => {
            window.location.href = url; //.substring(1);
            window.location.target = "_self";
          });
        });

        cy.get(selector + " span")
          .invoke("text")
          .then((url) => {
            cy.get(selector + " span")
              .click({ force: true })
              .wait(2000);
            cy.wait("@postExecute");
            cy.url().should("contain", url);
            cy.go(-1);
          });
      });

      // cy.wait(4000);
      // cy.get("div.tableWrap").should("be.visible"); //wait for page load!

      cy.waitUntil(() => cy.get("div.tableWrap").should("be.visible"), {
        errorMsg: "Page is not loaded evn after 10 secs",
        timeout: 30000,
        interval: 2000,
      }).then(() => cy.wait(1000)); //wait for page load!

      cy.isSelectRow(2); //as aft refresh row selection is also gone
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
              .xpath("//div[contains(@class, ' t--widget-textwidget')][1]", {
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

        cy.xpath("//div[contains(@class, ' t--widget-textwidget')][1]", {
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
              .xpath("//div[contains(@class, ' t--widget-textwidget')][1]", {
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

        cy.xpath("//div[contains(@class, ' t--widget-textwidget')][1]", {
          timeout: 30000,
        })
          .eq(0)
          .invoke("text")
          .then((addreduce) => {
            expect(addreduce).to.eq("CreditLimit:Reduce");
          });
      });

      //Another row!
      //Card Number mapping to text widget!
      cy.isSelectRow(4);
      cy.wait(2500); //time for table row select to reflect!
      cy.readTabledataPublish("4", "0").then((cardNumber) => {
        cy.xpath("//div[contains(@class, ' t--widget-textwidget')][1]")
          .eq(1)
          .invoke("text")
          .then((cardNo) => {
            var format = /^\d{4}-\d{4}-\d{4}(-\d{4})?$/;
            expect(cardNumber).match(format);
            expect(cardNumber).to.be.equal(cardNo);
          });
      });

      //Address mapping to text widget!
      cy.readTabledataPublish("4", "4").then((address) => {
        cy.xpath("//div[contains(@class, ' t--widget-textwidget')][2]")
          .eq(1)
          .invoke("text")
          .then((addr) => {
            expect(address.replace(/\r?\n|\r/, "")).to.eq(addr);
          });
      });

      //Validating Available limit column computation maintained!
      cy.readTabledataPublish("4", "16").then((availLimit) => {
        cy.readTabledataPublish("4", "13").then((creditLimit) => {
          cy.readTabledataPublish("4", "14").then((outstanding) => {
            expect(Number(availLimit)).to.eq(creditLimit - outstanding);
          });
        });
      });

      //Validating State button click & binding & text widget mapping!
      cy.getTableDataSelector("4", "15").then((selector) => {
        cy.get(selector + " button.bp3-button")
          .click()
          .wait(2000);

        cy.waitUntil(
          () =>
            cy
              .xpath("//div[contains(@class, ' t--widget-textwidget')][2]", {
                timeout: 50000,
              })
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
            cy.xpath("//div[contains(@class, ' t--widget-textwidget')][2]")
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
      cy.getTableDataSelector("4", "19").then((selector) => {
        // Stubbing window.open to open in the same tab
        cy.window().then((window) => {
          cy.stub(window, "open").callsFake((url) => {
            window.location.href = url; //.substring(1);
            window.location.target = "_self";
          });
        });

        cy.get(selector + " span")
          .invoke("text")
          .then((url) => {
            cy.get(selector + " span")
              .click({ force: true })
              .wait(2000);
            cy.wait("@postExecute");
            cy.url().should("contain", url);
            cy.go(-1);
          });
      });

      //cy.wait(4000);
      //cy.get("div.tableWrap").should("be.visible");

      cy.waitUntil(() => cy.get("div.tableWrap").should("be.visible"), {
        errorMsg: "Page is not loaded evn after 10 secs",
        timeout: 30000,
        interval: 2000,
      }).then(() => cy.wait(1000)); //wait for page load!

      //Manu Btn validation: - 1st menu item
      cy.isSelectRow(4); //as aft refresh row selection is also gone
      cy.getTableDataSelector("4", "18").then((selector) => {
        cy.get(selector + " button")
          .click()
          .wait(1000);

        cy.xpath(
          "//div//a[contains(@class, 'bp3-menu-item')]/div[text()='AddcreditLimit']/parent::a",
        )
          .click()
          .wait(2000); //allow time for n/w to finish

        cy.waitUntil(
          () =>
            cy
              .xpath("//div[contains(@class, ' t--widget-textwidget')][1]", {
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

        cy.xpath("//div[contains(@class, ' t--widget-textwidget')][1]", {
          timeout: 30000,
        })
          .eq(0)
          .invoke("text")
          .then((addreduce) => {
            expect(addreduce).to.eq("CreditLimit:Add");
          });
      });

      //Manu Btn validation: - 2nd menu item
      cy.getTableDataSelector("4", "18").then((selector) => {
        cy.get(selector + " button")
          .click()
          .wait(1000);

        cy.xpath(
          "//div//a[contains(@class, 'bp3-menu-item')]/div[text()='Reducecreditlimit']/parent::a",
        )
          .click()
          .wait(2000); //allow time for n/w to finish

        cy.waitUntil(
          () =>
            cy
              .xpath("//div[contains(@class, ' t--widget-textwidget')][1]", {
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

        cy.xpath("//div[contains(@class, ' t--widget-textwidget')][1]", {
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

    cy.selectEntityByName("Change color and font");
    cy.CheckAndUnfoldEntityItem("WIDGETS");
    cy.selectEntityByName("Table1");

    cy.get(widgetsPage.bold)
      .invoke("attr", "aria-selected")
      .then((sel) => expect(Boolean(sel)).to.be.true);
    cy.get(widgetsPage.centerAlign)
      .eq(0)
      .invoke("attr", "aria-selected")
      .then((sel) => expect(Boolean(sel)).to.be.true); //Text align
    cy.get(widgetsPage.centerAlign)
      .eq(1)
      .invoke("attr", "aria-selected")
      .then((sel) => expect(Boolean(sel)).to.be.true); //Vertical align
    cy.get(widgetsPage.textColor)
      .first()
      .invoke("attr", "value")
      .should("contain", "#2E3D49");
    cy.get(`${widgetsPage.cellBackground} input`)
      .first()
      .invoke("attr", "value")
      .should("contain", "#FFC13D");
    cy.validateCodeEditorContent(".t--property-control-textsize", "1.5rem");
  }); // Add dsl and Validate Migration on pageload
});
