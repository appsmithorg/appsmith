import {
  agHelper,
  jsEditor,
  apiPage,
  dataManager,
  assertHelper,
} from "../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../support/Pages/EditorNavigation";
const commonlocators = require("../../../locators/commonlocators.json");

describe(
  "Promises App tests",
  { tags: ["@tag.All", "@tag.JS", "@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("promisesStoreValueDsl");
    });

    it("1. Testing promises with resetWidget, storeValue action and API call", () => {
      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
        "TC1api",
      );
      apiPage.RunAPI();
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
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      cy.wait("@getConsolidatedData");
      // verify text in the text widget

      agHelper.AssertContains(
        "Step 4: Value is Green and will default to undefined",
      );
      // toggle off the switch
      cy.get(".t--switch-widget-active .bp3-control-indicator").click({
        force: true,
      });
      agHelper.ValidateToastMessage("Switch widget has changed");

      // select an option from select widget
      cy.get(".bp3-button.select-button").click({ force: true });
      cy.get(".menu-item-text").eq(2).click({ force: true });
      // verify text in the text widget

      agHelper.AssertContains(
        "Step 4: Value is Red and will default to undefined",
        "be.visible",
        ".t--draggable-textwidget span",
      );
      // move to page  2 on table widget
      agHelper.GetNClick(commonlocators.tableNextPage);
      cy.get(".t--table-widget-page-input").within(() => {
        cy.get("input.bp3-input").should("have.value", "2");
      });

      // hit audio play button and trigger actions
      EditorNavigation.SelectEntityByName("Audio1", EntityType.Widget);
      agHelper.GetElement("audio").then(($audio) => {
        $audio[0].play();
      });
      assertHelper.AssertNetworkStatus("@postExecute");
      // verify text is visible
      agHelper.AssertContains(
        "Step 4: Value is Green and will default to GREEN",
        "be.visible",
        ".t--draggable-textwidget span",
      );

      agHelper.GetNClick(commonlocators.tableNextPage);
      agHelper.ValidateToastMessage("Success running API query");
      agHelper.ValidateToastMessage("GREEN");
      agHelper.GetElement(".t--table-widget-page-input").within(() => {
        agHelper.ValidateFieldInputValue("input.bp3-input", "2");
      });
    });

    it("2. Testing dynamic widgets display using consecutive storeValue calls", () => {
      EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);
      jsEditor.SelectFunctionDropdown("clearStore");
      jsEditor.RunJSObj();
      PageLeftPane.switchSegment(PagePaneSegment.UI);
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
  },
);
