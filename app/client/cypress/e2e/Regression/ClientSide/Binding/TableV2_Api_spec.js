import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../locators/commonlocators.json");
import apiPage from "../../../../locators/ApiEditor";
import {
  entityExplorer,
  agHelper,
  deployMode,
} from "../../../../support/Objects/ObjectsCore";
import BottomTabs from "../../../../support/Pages/IDE/BottomTabs";

describe(
  "Test Create Api and Bind to Table widget V2",
  { tags: ["@tag.Binding"] },
  function () {
    let apiData;
    before(() => {
      agHelper.AddDsl("tableV2WidgetDsl");
    });
    it("1. Test_Add users api and execute api", function () {
      cy.createAndFillApi(this.dataSet.userApi, "/mock-api?records=100");
      cy.RunAPI();
      BottomTabs.response.selectResponseResponseTypeFromMenu("JSON");
      cy.get(apiPage.responseBody)
        .contains("name")
        .siblings("span")
        .invoke("text")
        .then((text) => {
          const value = text.match(/"(.*)"/)[0];
          cy.log(value);

          apiData = value;
          cy.log("val1:" + value);
        });
    });

    it("2. Test_Validate the Api data is updated on Table widget", function () {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget, {}, [
        "Container3",
      ]);
      cy.testJsontext("tabledata", "{{Api1.data}}");

      /**
       * readTabledata--> is to read the table contents
       * @param --> "row num" and "col num"
       */
      cy.readTableV2data("0", "5").then((tabData) => {
        expect(apiData).to.eq(`\"${tabData}\"`);
      });
      deployMode.DeployApp();
      cy.wait("@postExecute").then((interception) => {
        apiData = JSON.stringify(interception.response.body.data.body[0].name);
      });
      cy.readTableV2dataPublish("0", "5").then((tabData) => {
        expect(apiData).to.eq(`\"${tabData}\"`);
      });
      cy.get(commonlocators.backToEditor).click();

      cy.wait("@postExecute").then((interception) => {
        apiData = JSON.stringify(interception.response.body.data.body[0].name);
      });
      cy.readTableV2dataPublish("0", "5").then((tabData) => {
        expect(apiData).to.eq(`\"${tabData}\"`);
      });
    });

    it("3. Validate onSearchTextChanged function is called when configured for search text", function () {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget, {}, [
        "Container3",
      ]);
      agHelper.CheckUncheck(commonlocators.clientSideSearch, false);
      cy.get(".t--widget-tablewidgetv2 .t--search-input")
        .first()
        .type("Currey");
      cy.get(".tbody").should("be.visible");

      // Captures the API call made on search
      cy.wait("@postExecute").then((interception) => {
        apiData = JSON.stringify(interception.response.body.data.body[0].name);
      });
      cy.readTableV2dataPublish("0", "5").then((tabData) => {
        expect(apiData).to.eq(`\"${tabData}\"`);
      });
    });

    afterEach(() => {
      // put your clean up code if any
    });
  },
);
