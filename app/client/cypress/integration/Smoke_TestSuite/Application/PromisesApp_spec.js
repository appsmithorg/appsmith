import { ObjectsRegistry } from "../../../support/Objects/Registry";
const homePage = require("../../../locators/HomePage");
const dsl = require("../../../fixtures/promisesStoreValueDsl.json");
const widgetsPage = require("../../../locators/Widgets.json");
const commonlocators = require("../../../locators/commonlocators.json");
const jsEditorLocators = require("../../../locators/JSEditor.json");
let agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  jsEditor = ObjectsRegistry.JSEditor;
const newPage = "TableTest";

describe("JSEditor tests", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  beforeEach(() => {
    cy.startServerAndRoutes();
  });
  it("Testing promises with resetWidget, storeValue action and API call", () => {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("TC1api");
    cy.enterDatasourceAndPath("https://mock-api.appsmith.com/", "users");
    cy.SaveAndRunAPI();
    jsEditor.CreateJSObject(
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
    cy.CheckAndUnfoldEntityItem("PAGES");
    cy.get(`.t--entity-name:contains("Page1")`).click();
    cy.wait(4000);
    // verify text in the text widget
    cy.get(".t--draggable-textwidget span")
      .eq(2)
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
    // select an option from select widget
    cy.get(".bp3-button.select-button").click({ force: true });
    cy.get(".menu-item-text")
      .eq(2)
      .click({ force: true });
    cy.wait(2000);
    // verify text in the text widget
    cy.get(".t--draggable-textwidget span")
      .eq(2)
      .invoke("text")
      .then((text) => {
        expect(text).to.equal("Step 4: Value is Red and will default to RED");
      });
    // move to page  2 on table widget
    cy.get(commonlocators.tableNextPage).click();
    cy.get(".t--table-widget-page-input").within(() => {
      cy.get("input.bp3-input").should("have.value", "2");
    });
    cy.wait(3000);
    // hit audio play button and trigger actions
    cy.openPropertyPane("audiowidget");
    cy.get(widgetsPage.autoPlay).click({ force: true });
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(1000);
    cy.get(homePage.toastMessage).should(
      "contain",
      "Success running API query",
      "GREEN",
    );
    cy.wait(3000);
    // verify text is visible
    cy.get(".t--draggable-textwidget span")
      .eq(2)
      .invoke("text")
      .then((text) => {
        expect(text).to.equal(
          "Step 4: Value is Green and will default to GREEN",
        );
      });
    cy.get(".t--table-widget-page-input").within(() => {
      cy.get("input.bp3-input").should("have.value", "1");
    });
  });
  it("Testing dynamic widgets display using consecutive storeValue calls", () => {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("GenerateRecords");
    cy.enterDatasourceAndPath(
      "http://host.docker.internal:5001/v1/dynamicrecords",
      "/generaterecords?records=10",
    );
    cy.SaveAndRunAPI();
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("randomUserGenerator");
    cy.enterDatasourceAndPath(
      "http://host.docker.internal:5001/v1/dynamicrecords",
      "/getstudents",
    );
    cy.SaveAndRunAPI();
    cy.CreateAPI("failedQuery");
    cy.enterDatasourceAndPath("falseapi", "/getstudents");
    jsEditor.CreateJSObject(
      `export default {
        myFun1: () => { 
          // TC1.clearStore()
          return randomUserGenerator.run()
            .then((res) => {
            let values =
                [
                  storeValue('pic', res[0].image),
                  storeValue('phone', res[0].phone),
                  storeValue('email', res[0].email),
                  storeValue('lat', res[0].latitude),
                  storeValue('long', res[0].longitude),
                  storeValue('title', res[0].name),
                  storeValue('password', res[0].postalcode)
                ]
            return Promise.all(values)
              .then(() => {	
              showAlert("completed storing all values and now displaying fetched data on appropriate widgets") })
              .catch((err) => { 
              console.log("Could not store values ", err.toString())
              showAlert('Could not store values ', err.toString())		}) })
        },
        myFun2: async () => {
          return failedQuery.run()
            .then(() => showAlert("Query run was successful"))
            .catch(() => {
            return randomUserGenerator.run()
              .then((res) => {
              let values =
                  [
                    storeValue('pic', res[0].image),
                    storeValue('phone', res[0].phone),
                    storeValue('email', res[0].email),
                    storeValue('lat', res[0].latitude),
                    storeValue('long', res[0].longitude),
                    storeValue('title', res[0].name)
                  ]
              return Promise.all(values)
                .then(() => {	
                showAlert("completed storing all values and now displaying all values on appropriate widgets") })
                .catch((err) => { 
                console.log("Could not store value in store ", err.toString())
                showAlert('Could not store values in store ', err.toString())		
              }) 
            })
          })
        }}`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );
    cy.CheckAndUnfoldEntityItem("PAGES");
    cy.get(`.t--entity-name:contains("Page1")`).click();
    cy.wait(10000);
    cy.xpath("//span[text()='Clear store']").click({ force: true });
    cy.wait(5000);
    cy.pause();
    cy.get(".t--draggable-textwidget span")
      .eq(2)
      .invoke("text")
      .then((text) => {
        expect(text).to.equal(
          "Step 4: Value is Green and will default to undefined",
        );
      });
    // verify the clear store, cleared the values
    cy.get(".t--draggable-textwidget .bp3-ui-text span")
      .last()
      .should("contain.text", "undefined");
    cy.get(".t--draggable-inputwidgetv2")
      .first()
      .find(".bp3-input")
      .should("have.value", "undefined");

    cy.get(".t--draggable-inputwidgetv2")
      .last()
      .find(".bp3-input")
      .should("have.value", "undefined");

    cy.get(".t--draggable-phoneinputwidget")
      .find(".bp3-input")
      .should("have.value", "undefined");
    cy.xpath("//span[text()='Store values using promise.all']").click({
      force: true,
    });
    // values should be filled
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(homePage.toastMessage).should(
      "contain",
      "completed storing all values and now displaying fetched data on appropriate widgets",
    );
    cy.get(".t--draggable-textwidget .bp3-ui-text span")
      .last()
      .should("contain.text", "undefined");
    cy.get(".t--draggable-inputwidgetv2")
      .first()
      .find(".bp3-input")
      .should("have.value", "undefined");

    cy.get(".t--draggable-inputwidgetv2")
      .last()
      .find(".bp3-input")
      .should("have.value", "undefined");

    cy.get(".t--draggable-phoneinputwidget")
      .find(".bp3-input")
      .should("have.value", "undefined");

    cy.xpath("//span[text()='Store values using then/catch']").click({
      force: true,
    });
    cy.get(homePage.toastMessage).should(
      "contain",
      "completed storing all values and now displaying fetched data on appropriate widgets",
    );
    cy.pause();
  });
});
