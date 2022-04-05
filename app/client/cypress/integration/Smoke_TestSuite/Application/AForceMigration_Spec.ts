/// <reference types="Cypress" />
import { ObjectsRegistry } from "../../../support/Objects/Registry";

let homePage = ObjectsRegistry.HomePage,
  dataSources = ObjectsRegistry.DataSources,
  table = ObjectsRegistry.Table,
  agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  jsEditor = ObjectsRegistry.JSEditor;

describe("AForce - Community Issues page validations", function () {

  let reconnect = true, selectedRow: number;
  it("1. Import application json and validate headers", () => {

    homePage.ImportApp("AForceMigrationExport.json", reconnect)
    if (reconnect)
      dataSources.ReconnectDataSourcePostgres("AForceDB")
    //Validate table is not empty!
    table.WaitUntilTableLoad()
    //Validating order of header columns!
    table.AssertTableHeaderOrder("TypeTitleStatus+1CommentorsVotesAnswerUpVoteStatesupvote_ididgithub_issue_idauthorcreated_atdescriptionlabelsstatelinkupdated_at")
    //Validating hidden columns:
    table.AssertHiddenColumns(['States', 'upvote_id', 'id', 'github_issue_id', 'author', 'created_at', 'description', 'labels', 'state', 'link', 'updated_at'])

  });

  it("2. Validate table navigation with Server Side pagination enabled with Default selected row", () => {
    ee.SelectEntityByName("Table1", 'WIDGETS')
    agHelper.AssertExistingToggleState("serversidepagination", 'checked')

    agHelper.EvaluateExistingPropertyFieldValue("Default Selected Row")
      .then($selectedRow => {
        selectedRow = Number($selectedRow);
        table.AssertSelectedRow(selectedRow)
      });

    agHelper.DeployApp()
    table.WaitUntilTableLoad()

    //Verify hidden columns are infact hidden in deployed app!
    table.AssertTableHeaderOrder("TypeTitleStatus+1CommentorsVotesAnswerUpVote")//from case #1

    table.AssertSelectedRow(selectedRow)//Assert default selected row

    table.AssertPageNumber(1);
    table.NavigateToNextPage()//page 2
    agHelper.Sleep(3000)//wait for table navigation to take effect!
    table.WaitUntilTableLoad()
    table.AssertSelectedRow(selectedRow)


    table.NavigateToNextPage()//page 3
    agHelper.Sleep(3000)//wait for table navigation to take effect!
    table.WaitForTableEmpty()//page 3
    table.NavigateToPreviousPage()//page 2
    agHelper.Sleep(3000)//wait for table navigation to take effect!
    table.WaitUntilTableLoad()
    table.AssertSelectedRow(selectedRow)

    table.NavigateToPreviousPage()//page 1
    agHelper.Sleep(3000)//wait for table navigation to take effect!
    table.WaitUntilTableLoad()
    table.AssertSelectedRow(selectedRow)
    table.AssertPageNumber(1);

  })

  it("3. Validate table navigation with Server Side pagination disabled with Default selected row selection", () => {

    agHelper.NavigateBacktoEditor()
    table.WaitUntilTableLoad()
    ee.SelectEntityByName("Table1", 'WIDGETS')
    agHelper.ToggleOnOrOff('serversidepagination', 'Off')
    agHelper.DeployApp()
    table.WaitUntilTableLoad()
    table.AssertPageNumber(1, 'Off');
    table.AssertSelectedRow(selectedRow)
    agHelper.NavigateBacktoEditor()
    table.WaitUntilTableLoad()
    ee.SelectEntityByName("Table1")
    agHelper.ToggleOnOrOff('serversidepagination', 'On')

  });

  it("4. Change Default selected row in table and verify", () => {

    jsEditor.EnterJSContext("defaultselectedrow", "1", true)
    agHelper.DeployApp()
    table.WaitUntilTableLoad()
    table.AssertPageNumber(1);
    table.AssertSelectedRow(1)
    table.NavigateToNextPage()//page 2
    table.AssertPageNumber(2);
    table.AssertSelectedRow(1)
    agHelper.NavigateBacktoEditor()
    table.WaitUntilTableLoad()

  });

  // it("4. Verify Default search text in table as per 'Default Search Text' property set", () => {

  // });

  // it.skip("5. Validate Search table with Client Side Search enabled & disabled", () => {

  // })

  // it.skip("6. Validate Filter table", () => {

  // })

  // it.skip("7. Validate Filter table", () => {

  // })

  // it.skip("8. Validate Updating issue from Details tab", () => {

  // })

  // it.skip("9. Validate Adding a New issue from Add Modal", () => {


  // })

  // it.skip("10. Validate Deleting the newly created issue", () => {


  //   //Validating Id column sorting happens as Datatype is Number in app!
  //   cy.xpath(
  //     "//div[@class='tableWrap']//div[@class='thead']//div[@class='tr'][1]//div[@role='columnheader']//div[text()='id']",
  //   )
  //     .click()
  //     .wait(2000);

  //   cy.readTabledataPublish("0", "1").then((cellData) => {
  //     expect(cellData).to.be.equal("100");
  //   });

  //   cy.readTabledataPublish("1", "1").then((cellData) => {
  //     expect(cellData).to.be.equal("99");
  //   });

  //   cy.readTabledataPublish("2", "1").then((cellData) => {
  //     expect(cellData).to.be.equal("98");
  //   });

  //   //Revert the Id column sorting!
  //   cy.xpath(
  //     "//div[@class='tableWrap']//div[@class='thead']//div[@class='tr'][1]//div[@role='columnheader']//div[text()='id']",
  //   )
  //     .click()
  //     .wait(2000);

  //   cy.readTabledataPublish("0", "1").then((cellData) => {
  //     expect(cellData).to.be.equal("1");
  //   });

  //   cy.readTabledataPublish("1", "1").then((cellData) => {
  //     expect(cellData).to.be.equal("2");
  //   });

  //   cy.readTabledataPublish("2", "1").then((cellData) => {
  //     expect(cellData).to.be.equal("3");
  //   });

  //   //Validating image column is present:
  //   cy.getTableDataSelector("0", "10").then((selector) => {
  //     cy.get(selector + " div")
  //       .invoke("attr", "class")
  //       .then((classes) => {
  //         cy.log("classes are:" + classes);
  //         expect(classes).to.eq("image-cell");
  //       });
  //   });

  //   //Card Number mapping to text widget!
  //   cy.isSelectRow(2);
  //   cy.wait(2500); //time for table row select to reflect!
  //   cy.readTabledataPublish("2", "0").then((cardNumber) => {
  //     cy.xpath("//div[contains(@class, ' t--widget-textwidget')][1]")
  //       .eq(1)
  //       .invoke("text")
  //       .then((cardNo) => {
  //         var format = /^\d{4}-\d{4}-\d{4}(-\d{4})?$/;
  //         expect(cardNumber).match(format);
  //         expect(cardNumber).to.be.equal(cardNo);
  //       });
  //   });

  //   //Address mapping to text widget!
  //   cy.readTabledataPublish("2", "4").then((address) => {
  //     cy.xpath("//div[contains(@class, ' t--widget-textwidget')][2]")
  //       .eq(1)
  //       .invoke("text")
  //       .then((addr) => {
  //         expect(address.replace(/\r?\n|\r/, "")).to.eq(addr);
  //       });
  //   });

  //   //Validating Available limit column computation maintained!
  //   cy.readTabledataPublish("2", "16").then((availLimit) => {
  //     cy.readTabledataPublish("2", "13").then((creditLimit) => {
  //       cy.readTabledataPublish("2", "14").then((outstanding) => {
  //         expect(Number(availLimit)).to.eq(creditLimit - outstanding);
  //       });
  //     });
  //   });

  //   //Validating State button click & binding & text widget mapping!
  //   cy.getTableDataSelector("2", "15").then((selector) => {
  //     cy.get(selector + " button.bp3-button")
  //       .click()
  //       .wait(3000);

  //     cy.waitUntil(
  //       () =>
  //         cy
  //           .xpath("//div[contains(@class, ' t--widget-textwidget')][2]", {
  //             timeout: 30000,
  //           })
  //           .eq(0)
  //           .should("contain.text", "State:"),
  //       {
  //         errorMsg: "Execute call did not complete evn after 10 secs",
  //         timeout: 20000,
  //         interval: 1000,
  //       },
  //     ).then(() => cy.wait(500));

  //     cy.get(selector + " button span")
  //       .invoke("text")
  //       .then((statetxt) => {
  //         cy.xpath("//div[contains(@class, ' t--widget-textwidget')][2]")
  //           .eq(0)
  //           .invoke("text")
  //           .then((txtWidtxt) => {
  //             cy.log("statetxt is:" + statetxt);
  //             let text =
  //               statetxt == "Activate" ? "State:Inactive" : "State:Active";
  //             expect(text).to.eq(txtWidtxt);
  //           });
  //       });
  //   });

  //   //Validating Image URL click & navigation!
  //   cy.getTableDataSelector("2", "19").then((selector) => {
  //     // Stubbing window.open to open in the same tab
  //     cy.window().then((window) => {
  //       cy.stub(window, "open").callsFake((url) => {
  //         window.location.href = url; //.substring(1);
  //         window.location.target = "_self";
  //       });
  //     });

  //     cy.get(selector + " span.bp3-popover-target span")
  //       .invoke("text")
  //       .then((url) => {
  //         cy.get(selector + " span.bp3-popover-target")
  //           .click()
  //           .wait(2000);
  //         cy.wait("@postExecute");
  //         cy.url().should("contain", url);
  //         cy.go(-1);
  //       });
  //   });

  //   // cy.wait(4000);
  //   // cy.get("div.tableWrap").should("be.visible"); //wait for page load!

  //   cy.waitUntil(
  //     () => cy.get("div.tableWrap", { timeout: 30000 }).should("be.visible"),
  //     {
  //       errorMsg: "Page is not loaded evn after 10 secs",
  //       timeout: 30000,
  //       interval: 2000,
  //     },
  //   ).then(() => cy.wait(1000)); //wait for page load!

  //   cy.isSelectRow(2); //as aft refresh row selection is also gone
  //   cy.getTableDataSelector("2", "18").then((selector) => {
  //     cy.get(selector + " button")
  //       .click()
  //       .wait(1000);

  //     cy.xpath(
  //       "//div//a[contains(@class, 'bp3-menu-item')]/div[text()='AddcreditLimit']/parent::a",
  //     )
  //       .click()
  //       .wait(2000);

  //     cy.waitUntil(
  //       () =>
  //         cy
  //           .xpath("//div[contains(@class, ' t--widget-textwidget')][1]", {
  //             timeout: 30000,
  //           })
  //           .eq(0)
  //           .should("contain.text", "CreditLimit:"),
  //       {
  //         errorMsg: "Execute call did not complete evn after 10 secs",
  //         timeout: 20000,
  //         interval: 1000,
  //       },
  //     ).then(() => cy.wait(500)); //allow time for n/w to finish

  //     cy.xpath("//div[contains(@class, ' t--widget-textwidget')][1]", {
  //       timeout: 30000,
  //     })
  //       .eq(0)
  //       .invoke("text")
  //       .then((addreduce) => {
  //         expect(addreduce).to.eq("CreditLimit:Add");
  //       });
  //   });

  //   //Manu Btn validation: - 2nd menu item
  //   cy.getTableDataSelector("2", "18").then((selector) => {
  //     cy.get(selector + " button")
  //       .click()
  //       .wait(1000);

  //     cy.xpath(
  //       "//div//a[contains(@class, 'bp3-menu-item')]/div[text()='Reducecreditlimit']/parent::a",
  //     )
  //       .click()
  //       .wait(2000);

  //     cy.waitUntil(
  //       () =>
  //         cy
  //           .xpath("//div[contains(@class, ' t--widget-textwidget')][1]", {
  //             timeout: 30000,
  //           })
  //           .eq(0)
  //           .should("contain.text", "CreditLimit:"),
  //       {
  //         errorMsg: "Execute call did not complete evn after 10 secs",
  //         timeout: 20000,
  //         interval: 1000,
  //       },
  //     ).then(() => cy.wait(500)); //allow time for n/w to finish

  //     cy.xpath("//div[contains(@class, ' t--widget-textwidget')][1]", {
  //       timeout: 30000,
  //     })
  //       .eq(0)
  //       .invoke("text")
  //       .then((addreduce) => {
  //         expect(addreduce).to.eq("CreditLimit:Reduce");
  //       });
  //   });

  //   //Another row!
  //   //Card Number mapping to text widget!
  //   cy.isSelectRow(4);
  //   cy.wait(2500); //time for table row select to reflect!
  //   cy.readTabledataPublish("4", "0").then((cardNumber) => {
  //     cy.xpath("//div[contains(@class, ' t--widget-textwidget')][1]")
  //       .eq(1)
  //       .invoke("text")
  //       .then((cardNo) => {
  //         var format = /^\d{4}-\d{4}-\d{4}(-\d{4})?$/;
  //         expect(cardNumber).match(format);
  //         expect(cardNumber).to.be.equal(cardNo);
  //       });
  //   });

  //   //Address mapping to text widget!
  //   cy.readTabledataPublish("4", "4").then((address) => {
  //     cy.xpath("//div[contains(@class, ' t--widget-textwidget')][2]")
  //       .eq(1)
  //       .invoke("text")
  //       .then((addr) => {
  //         expect(address.replace(/\r?\n|\r/, "")).to.eq(addr);
  //       });
  //   });

  //   //Validating Available limit column computation maintained!
  //   cy.readTabledataPublish("4", "16").then((availLimit) => {
  //     cy.readTabledataPublish("4", "13").then((creditLimit) => {
  //       cy.readTabledataPublish("4", "14").then((outstanding) => {
  //         expect(Number(availLimit)).to.eq(creditLimit - outstanding);
  //       });
  //     });
  //   });

  //   //Validating State button click & binding & text widget mapping!
  //   cy.getTableDataSelector("4", "15").then((selector) => {
  //     cy.get(selector + " button.bp3-button")
  //       .click()
  //       .wait(2000);

  //     cy.waitUntil(
  //       () =>
  //         cy
  //           .xpath("//div[contains(@class, ' t--widget-textwidget')][2]", {
  //             timeout: 30000,
  //           })
  //           .eq(0)
  //           .should("contain.text", "State:"),
  //       {
  //         errorMsg: "Execute call did not complete evn after 10 secs",
  //         timeout: 20000,
  //         interval: 1000,
  //       },
  //     ).then(() => cy.wait(500));

  //     cy.get(selector + " button span")
  //       .invoke("text")
  //       .then((statetxt) => {
  //         cy.xpath("//div[contains(@class, ' t--widget-textwidget')][2]")
  //           .eq(0)
  //           .invoke("text")
  //           .then((txtWidtxt) => {
  //             cy.log("statetxt is:" + statetxt);
  //             let text =
  //               statetxt == "Activate" ? "State:Inactive" : "State:Active";
  //             expect(text).to.eq(txtWidtxt);
  //           });
  //       });
  //   });

  //   //Validating Image URL click & navigation!
  //   cy.getTableDataSelector("4", "19").then((selector) => {
  //     // Stubbing window.open to open in the same tab
  //     cy.window().then((window) => {
  //       cy.stub(window, "open").callsFake((url) => {
  //         window.location.href = url; //.substring(1);
  //         window.location.target = "_self";
  //       });
  //     });

  //     cy.get(selector + " span.bp3-popover-target span")
  //       .invoke("text")
  //       .then((url) => {
  //         cy.get(selector + " span.bp3-popover-target")
  //           .click()
  //           .wait(2000);
  //         cy.wait("@postExecute");
  //         cy.url().should("contain", url);
  //         cy.go(-1);
  //       });
  //   });

  //   //cy.wait(4000);
  //   //cy.get("div.tableWrap").should("be.visible");

  //   cy.waitUntil(
  //     () => cy.get("div.tableWrap", { timeout: 30000 }).should("be.visible"),
  //     {
  //       errorMsg: "Page is not loaded evn after 10 secs",
  //       timeout: 30000,
  //       interval: 2000,
  //     },
  //   ).then(() => cy.wait(1000)); //wait for page load!

  //   //Manu Btn validation: - 1st menu item
  //   cy.isSelectRow(4); //as aft refresh row selection is also gone
  //   cy.getTableDataSelector("4", "18").then((selector) => {
  //     cy.get(selector + " button")
  //       .click()
  //       .wait(1000);

  //     cy.xpath(
  //       "//div//a[contains(@class, 'bp3-menu-item')]/div[text()='AddcreditLimit']/parent::a",
  //     )
  //       .click()
  //       .wait(2000); //allow time for n/w to finish

  //     cy.waitUntil(
  //       () =>
  //         cy
  //           .xpath("//div[contains(@class, ' t--widget-textwidget')][1]", {
  //             timeout: 30000,
  //           })
  //           .eq(0)
  //           .should("contain.text", "CreditLimit:"),
  //       {
  //         errorMsg: "Execute call did not complete evn after 10 secs",
  //         timeout: 20000,
  //         interval: 1000,
  //       },
  //     ).then(() => cy.wait(500)); //allow time for n/w to finish

  //     cy.xpath("//div[contains(@class, ' t--widget-textwidget')][1]", {
  //       timeout: 30000,
  //     })
  //       .eq(0)
  //       .invoke("text")
  //       .then((addreduce) => {
  //         expect(addreduce).to.eq("CreditLimit:Add");
  //       });
  //   });

  //   //Manu Btn validation: - 2nd menu item
  //   cy.getTableDataSelector("4", "18").then((selector) => {
  //     cy.get(selector + " button")
  //       .click()
  //       .wait(1000);

  //     cy.xpath(
  //       "//div//a[contains(@class, 'bp3-menu-item')]/div[text()='Reducecreditlimit']/parent::a",
  //     )
  //       .click()
  //       .wait(2000); //allow time for n/w to finish

  //     cy.waitUntil(
  //       () =>
  //         cy
  //           .xpath("//div[contains(@class, ' t--widget-textwidget')][1]", {
  //             timeout: 30000,
  //           })
  //           .eq(0)
  //           .should("contain.text", "CreditLimit:"),
  //       {
  //         errorMsg: "Execute call did not complete evn after 10 secs",
  //         timeout: 20000,
  //         interval: 1000,
  //       },
  //     ).then(() => cy.wait(500)); //allow time for n/w to finish

  //     cy.xpath("//div[contains(@class, ' t--widget-textwidget')][1]", {
  //       timeout: 30000,
  //     })
  //       .eq(0)
  //       .invoke("text")
  //       .then((addreduce) => {
  //         expect(addreduce).to.eq("CreditLimit:Reduce");
  //       });
  //   });
  // });

  // //Page 2 Validations:

  // cy.selectEntityByName("Change color and font");
  // cy.selectEntityByName("WIDGETS");
  // cy.selectEntityByName("Table1");

  // cy.get(widgetsPage.bold)
  //   .invoke("attr", "aria-selected")
  //   .then((sel) => expect(Boolean(sel)).to.be.true);
  // cy.get(widgetsPage.centerAlign)
  //   .eq(0)
  //   .invoke("attr", "aria-selected")
  //   .then((sel) => expect(Boolean(sel)).to.be.true); //Text align
  // cy.get(widgetsPage.centerAlign)
  //   .eq(1)
  //   .invoke("attr", "aria-selected")
  //   .then((sel) => expect(Boolean(sel)).to.be.true); //Vertical align
  // cy.get(widgetsPage.textColor)
  //   .first()
  //   .invoke("attr", "value")
  //   .should("contain", "#2E3D49");
  // cy.get(`${widgetsPage.cellBackground} input`)
  //   .first()
  //   .invoke("attr", "value")
  //   .should("contain", "#FFC13D");
  // cy.get(widgetsPage.selectedTextSize).should("have.text", "24px");

  //});
});
