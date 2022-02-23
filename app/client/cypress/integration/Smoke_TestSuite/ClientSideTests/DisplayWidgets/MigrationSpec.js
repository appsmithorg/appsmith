const homePage = require("../../../../locators/HomePage.json");

describe("Migration Validate", function() {
  it("1. Import application and Validate Migration on pageload", function() {
    // import application
    cy.get(homePage.homeIcon).click();
    cy.get(homePage.optionsIcon)
      .first()
      .click();
    cy.get(homePage.orgImportAppOption).click({ force: true });
    cy.get(homePage.orgImportAppModal).should("be.visible");
    cy.xpath(homePage.uploadLogo).attachFile("TableMigrationAppExported.json");
    cy.get(homePage.orgImportAppButton).click({ force: true });
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
      cy.get(homePage.applicationName)
        .clear()
        .type(`app${name}`);
      cy.wrap(`app${name}`).as("appname");
      cy.wait(2000);

      // Validating data binding for the imported application

      //Validating Latitude & Longitude are hidden columns:
      cy.xpath(
        "//div[@class='tableWrap']//div[@class='thead']//div[@class='tr'][1]//div[@role='columnheader']/div[text()='latitude']",
      )
        .invoke("attr", "class")
        .then((classes) => {
          cy.log("classes are:" + classes);
          expect(classes).includes("hidden-header");
        });

      cy.xpath(
        "//div[@class='tableWrap']//div[@class='thead']//div[@class='tr'][1]//div[@role='columnheader']/div[text()='longitude']",
      )
        .invoke("attr", "class")
        .then((classes) => {
          cy.log("classes are:" + classes);
          expect(classes).includes("hidden-header");
        });

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

      //Validating Id column sorting reverted!
      cy.readTabledataPublish("0", "1").then((cellData) => {
        expect(cellData).to.be.equal("1");
      });

      cy.readTabledataPublish("1", "1").then((cellData) => {
        expect(cellData).to.be.equal("2");
      });

      cy.readTabledataPublish("2", "1").then((cellData) => {
        expect(cellData).to.be.equal("3");
      });

      //Card Number mapping to text widget!
      cy.isSelectRow(2);
      cy.wait(2500); //time for table row select to reflect!
      cy.readTabledataPublish("2", "0").then((cardNumber) => {
        cy.xpath("//div[contains(@class, ' t--widget-textwidget')][1]")
          .eq(1)
          .invoke("text")
          .then((cardNo) => {
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
      cy.readTabledataPublish("0", "16").then((availLimit) => {
        cy.readTabledataPublish("0", "13").then((creditLimit) => {
          cy.readTabledataPublish("0", "14").then((outstanding) => {
            expect(Number(availLimit)).to.eq(creditLimit - outstanding);
          });
        });
      });

      //Validating State button click & binding & text widget mapping!
      cy.getTableDataSelector("0", "15").then((selector) => {
        cy.get(selector + " button.bp3-button")
          .click()
          .wait(5000);
        // cy.wait("@postExecute");
        // cy.wait("@postExecute");
        // cy.wait("@postExecute", { timeout: 8000 }).then(({ response }) => {
        //   expect(response.body.data.body.url).contains("get?action");
        // });

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
      cy.getTableDataSelector("0", "19").then((selector) => {
        // Stubbing window.open to open in the same tab
        cy.window().then((window) => {
          cy.stub(window, "open").callsFake((url) => {
            window.location.href = url; //.substring(1);
            window.location.target = "_self";
          });
        });

        cy.get(selector + " span.bp3-popover-target span")
          .invoke("text")
          .then((url) => {
            cy.get(selector + " span.bp3-popover-target")
              .click()
              .wait(2000);
            cy.wait("@postExecute");
            cy.url().should("contain", url);
            cy.go(-1);
          });
      });

      cy.wait(4000);
      cy.get("div.tableWrap").should("be.visible"); //wait for page load!

      cy.getTableDataSelector("0", "18").then((selector) => {
        cy.get(selector + " button")
          .click()
          .wait(1000);

        cy.xpath(
          "//div//a[contains(@class, 'bp3-menu-item')]/div[text()='AddcreditLimit']/parent::a",
        )
          .click()
          .wait(5000); //allow time for n/w to finish
        cy.xpath("//div[contains(@class, ' t--widget-textwidget')][1]")
          .eq(0)
          .invoke("text")
          .then((addreduce) => {
            expect(addreduce).to.eq("CreditLimit:Add");
          });
      });

      //Manu Btn validation: - 2nd menu item
      cy.getTableDataSelector("0", "18").then((selector) => {
        cy.get(selector + " button")
          .click()
          .wait(1000);

        cy.xpath(
          "//div//a[contains(@class, 'bp3-menu-item')]/div[text()='Reducecreditlimit']/parent::a",
        )
          .click()
          .wait(5000); //allow time for n/w to finish
        cy.xpath("//div[contains(@class, ' t--widget-textwidget')][1]")
          .eq(0)
          .invoke("text")
          .then((addreduce) => {
            expect(addreduce).to.eq("CreditLimit:Reduce");
          });
      });

      //Another row!
      //Card Number mapping to text widget!
      cy.isSelectRow(2);
      cy.wait(2500); //time for table row select to reflect!
      cy.readTabledataPublish("2", "0").then((cardNumber) => {
        cy.xpath("//div[contains(@class, ' t--widget-textwidget')][1]")
          .eq(1)
          .invoke("text")
          .then((cardNo) => {
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
          .wait(5000);
        // cy.wait("@postExecute"); //echo post
        // cy.wait("@postExecute"); //onrow select
        // cy.wait("@postExecute"); //echo post
        // cy.wait("@postExecute"); //echo post
        // cy.wait("@postExecute"); //echo post
        // cy.wait("@postExecute", { timeout: 8000 }).then(({ response }) => {
        //   expect(response.body.data.body.url).contains("get?action");
        //   expect(response.body.data.isExecutionSuccess).to.eq(true);
        // });

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

        cy.get(selector + " span.bp3-popover-target span")
          .invoke("text")
          .then((url) => {
            cy.get(selector + " span.bp3-popover-target")
              .click()
              .wait(2000);
            cy.wait("@postExecute");
            cy.url().should("contain", url);
            cy.go(-1);
          });
      });

      cy.wait(4000);
      cy.get("div.tableWrap").should("be.visible"); //wait for page load!

      //Manu Btn validation: - 1st menu item
      cy.isSelectRow(2);
      cy.getTableDataSelector("2", "18").then((selector) => {
        cy.get(selector + " button")
          .click()
          .wait(1000);

        cy.xpath(
          "//div//a[contains(@class, 'bp3-menu-item')]/div[text()='AddcreditLimit']/parent::a",
        )
          .click()
          .wait(5000); //allow time for n/w to finish
        cy.xpath("//div[contains(@class, ' t--widget-textwidget')][1]")
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
          .wait(5000); //allow time for n/w to finish
        cy.xpath("//div[contains(@class, ' t--widget-textwidget')][1]")
          .eq(0)
          .invoke("text")
          .then((addreduce) => {
            expect(addreduce).to.eq("CreditLimit:Reduce");
          });
      });
    });
  });
});
