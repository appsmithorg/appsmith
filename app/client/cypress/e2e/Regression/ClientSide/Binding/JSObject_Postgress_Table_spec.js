import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
import homePage from "../../../../locators/HomePage";
import * as _ from "../../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../../support/Pages/DataSources";

let datasourceName;
let currentUrl;

describe(
  "Addwidget from Query and bind with other widgets",
  { tags: ["@tag.Binding", "@tag.Sanity"] },
  function () {
    beforeEach(() => {
      _.dataSources.StartDataSourceRoutes();
    });

    it("1. Create a query and populate response by choosing addWidget and validate in Table Widget & Bug 7413", () => {
      _.agHelper.AddDsl("inputdsl");

      cy.createPostgresDatasource();
      cy.get("@saveDatasource").then((httpResponse) => {
        datasourceName = httpResponse.response.body.data.name;

        _.dataSources.CreateQueryAfterDSSaved(
          "SELECT * FROM configs LIMIT 10;",
        );
        // Resetting the default query and rewriting a new one
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(1000);
        // Mock the response for this test
        cy.intercept("/api/v1/actions/execute", {
          fixture: "addWidgetTable-mock",
        });
        cy.onlyQueryRun();
        _.dataSources.AddSuggestedWidget(Widgets.Table);
        _.jsEditor.CreateJSObject("return Query1.data;");
        EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
        _.propPane.EnterJSContext("Table data", "{{JSObject1.myFun1()}}");
        _.table.SelectTableRow(1, 0, true, "v2");
        cy.readTableV2dataPublish("1", "0").then((tabData) => {
          let tabValue = tabData;
          cy.log("the value is" + tabValue);
          expect(tabValue).to.be.equal("5");
        });
        cy.get(homePage.shareApp).click();
        cy.enablePublicAccess(true);
        cy.wait(3000);
        _.deployMode.DeployApp();
        cy.wait(3000);
        cy.url().then((url) => {
          currentUrl = url;
          cy.log("Published url is: " + currentUrl);
          _.deployMode.NavigateBacktoEditor();
          cy.wait(2000);
          cy.visit(currentUrl, { timeout: 60000 });
          cy.wait("@getConsolidatedData").should(
            "have.nested.property",
            "response.body.responseMeta.status",
            200,
          );
          cy.wait(3000);
          cy.waitUntil(
            () =>
              cy
                .get(
                  '.tbody .td[data-rowindex="' +
                    1 +
                    '"][data-colindex="' +
                    0 +
                    '"]',
                  {
                    timeout: 40000,
                  },
                )
                .eq(0)
                .should("be.visible"),
            {
              errorMsg: "Table not visible in Public view page",
              timeout: 20000,
              interval: 1000,
            },
          ).then(() => cy.wait(500));

          _.table.SelectTableRow(1, 0, true, "v2");
          cy.readTableV2dataPublish("1", "0").then((tabData) => {
            let tabValue = tabData;
            cy.log("Value in public viewing: " + tabValue);
            expect(tabValue).to.be.equal("5");
            cy.log("Verified that JSObject is visible for Public viewing");
          });

          // cy.tablefirstdataRow().then((tabValue) => {
          //   expect(tabValue).to.be.equal("5");
          //   //expect(tabValue).to.have.lengthOf(0); // verification while JS Object was still Beta!
          //   //cy.log("Verified that JSObject is not visible for Public viewing");
          // });
        });
      });
    });
  },
);
