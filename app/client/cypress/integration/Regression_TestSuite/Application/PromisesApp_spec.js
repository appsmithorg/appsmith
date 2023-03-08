import * as _ from "../../../support/Objects/ObjectsCore";
const homePage = require("../../../locators/HomePage");
const dsl = require("../../../fixtures/promisesStoreValueDsl.json");
const commonlocators = require("../../../locators/commonlocators.json");

describe("JSEditor tests", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Testing promises with resetWidget, storeValue action and API call", () => {
    _.apiPage.CreateAndFillApi(_.agHelper.mockApiUrl, "TC1api");
    _.apiPage.RunAPI();
    _.jsEditor.CreateJSObject(
      `export default {
        myFun1: async () => { //comment
          await this.clearStore()		//clear store value before running the case
          return resetWidget('Switch1')
            .then(() => {
              resetWidget('Select1')
              resetWidget('Table1')
              return this.myFun2() 		//return a toast message
                .then(() => {
                  storeValue('selected', Select1.selectedOptionValue)
                  showAlert(appsmith.store.selected) }) }) 		//return a second toast message
            .catch(() =>  {
              resetWidget('RadioGroup1')
              showAlert("Couldn't execute all the success call steps, hence now in the fail part") })
        },
        myFun2: () => {
          return TC1api.run()
            .then (() => {return showAlert("Success running API query")})
            .catch (() => {return showAlert("Couldn't run API query")})
        },
        clearStore: async () => { //function to clear store values
          Object.keys(appsmith.store).forEach((eachKey) => {
            storeValue(eachKey, 'undefined')
            //return showAlert(eachKey)
           })
        }
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    // verify text in the text widget
    cy.get(".t--draggable-textwidget span")
      .eq(5)
      .invoke("text")
      .then((text) => {
        expect(text).to.equal(
          "Step 4: Value is Green and will default to undefined",
        );
      });
    // toggle off the switch
    cy.get(".t--switch-widget-active .bp3-control-indicator").click({
      force: true,
    });
    cy.get(homePage.toastMessage).should(
      "contain",
      "Switch widget has changed",
    );

    // select an option from select widget
    cy.get(".bp3-button.select-button").click({ force: true });
    cy.get(".menu-item-text")
      .eq(2)
      .click({ force: true });
    cy.wait(2000);
    // verify text in the text widget
    cy.get(".t--draggable-textwidget span")
      .eq(5)
      .invoke("text")
      .then((text) => {
        expect(text).to.equal(
          "Step 4: Value is Red and will default to undefined",
        );
      });
    // move to page  2 on table widget
    cy.get(commonlocators.tableNextPage).click();
    cy.get(".t--table-widget-page-input").within(() => {
      cy.get("input.bp3-input").should("have.value", "2");
    });
    cy.wait(3000);
    // hit audio play button and trigger actions
    /* cy.openPropertyPane("audiowidget");
    cy.get(widgetsPage.autoPlay).click({ force: true });
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(1000)
     // verify text is visible
     cy.get(".t--draggable-textwidget span")
     .eq(2)
     .invoke("text")
     .then((text) => {
       expect(text).to.equal("Step 4: Value is Green and will default to Green");
     });
     cy.get(commonlocators.tableNextPage).click()
     cy.get('.t--table-widget-page-input').within(()=>{
       cy.get('input.bp3-input').should('have.value', '1')
     })
    cy.get(homePage.toastMessage).should(
      "contain",
      "Success running API query",
      "GREEN",
    ); */
  });

  //Skipping reason? to add
  it.skip("2. Testing dynamic widgets display using consecutive storeValue calls", () => {
    _.entityExplorer.SelectEntityByName("JSObject1", "Queries/JS");
    _.jsEditor.SelectFunctionDropdown("clearStore");
    _.jsEditor.RunJSObj();
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.xpath("//span[text()='Clear store']").click({ force: true });
    cy.get(".t--draggable-textwidget span")
      .eq(5)
      .invoke("text")
      .then((text) => {
        expect(text).to.equal(
          "Step 4: Value is Green and will default to undefined",
        );
      });
  });
});
