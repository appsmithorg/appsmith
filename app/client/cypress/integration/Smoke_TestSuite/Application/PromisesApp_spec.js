import { ObjectsRegistry } from "../../../support/Objects/Registry";
const homePage = require("../../../locators/HomePage");
const dsl = require("../../../fixtures/promisesStoreValueDsl.json");
const widgetsPage = require("../../../locators/Widgets.json");
const commonlocators = require("../../../locators/commonlocators.json");
const jsEditorLocators = require("../../../locators/JSEditor.json");
let agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  jsEditor = ObjectsRegistry.JSEditor;

describe("JSEditor tests", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });
  it("Testing promises with resetWidget, storeValue action and API call", () => {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("Api12");
    cy.enterDatasourceAndPath("https://mock-api.appsmith.com/", "users");
    cy.SaveAndRunAPI();
    cy.ResponseStatusCheck("200");
    cy.CheckAndUnfoldEntityItem("PAGES");
    jsEditor.CreateJSObject(
      `export default {
        myFun1: () => {
          resetWidget('Switch1')
            .then(() => { 
              storeValue('selectedValue', Select1.selectedOptionValue)
              showAlert(appsmith.store.selectedValue)
              return resetWidget('Select1')
                .then(() => {
                  storeValue('defaultSelected', Select1.defaultOptionValue)
                  showAlert(appsmith.store.defaultSelected)
          }) })
          return this.myFun2()
        },  
        myFun2: () => {
          return Api12.run()
            .then (() => showAlert("Success running API query"))
            .catch (() => showAlert("Couldn't run API query"))
        }
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );
    // run the jsObject
    cy.get(jsEditorLocators.runButton)
      .first()
      .click();
    //cy.wait(10000)
    cy.pause();
    cy.get(".t--entity-item:contains(Page1)")
      .first()
      .click();
    cy.wait("@getPage");
    // verify text in the text widget
    cy.get(".t--draggable-textwidget span")
      .last()
      .invoke("text")
      .then((text) => {
        expect(text).to.equal(
          "Step 4: Value is GREEN and will default to GREEN",
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
    // hit audio play button and trigger actions
    cy.openPropertyPane("audiowidget");

    // debug here, audio widget fails and also jsobject gives error sometimes!!

    cy.widgetText("Audio1", widgetsPage.audioWidget, commonlocators.audioInner);
    cy.get(commonlocators.onPlay).click();
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(homePage.toastMessage).should("contain", "GREEN");
    cy.get(homePage.toastMessage).should(
      "contain",
      "Success running API query",
    );
  });
});
