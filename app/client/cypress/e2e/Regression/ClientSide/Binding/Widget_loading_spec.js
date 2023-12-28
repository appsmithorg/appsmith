import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

let datasourceName;

describe(
  "Binding the multiple widgets and validating default data",
  { tags: ["@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("rundsl");
    });

    it("1. Create a postgres datasource", function () {
      _.dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(($dsName) => {
        datasourceName = $dsName;
        //Create and runs query
        _.dataSources.CreateQueryAfterDSSaved("select * from users limit 10");
        cy.EvaluateCurrentValue("select * from users limit 10");
        _.dataSources.RunQuery();
      });
    });

    it("2. Button widget test with on action query run", function () {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

      cy.executeDbQuery("Query1", "onClick");
      cy.wait("@updateLayout").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      //Input widget test with default value update with query data
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);

      cy.get(widgetsPage.defaultInput).type(testdata.defaultInputQuery);
      cy.wait("@updateLayout").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
    });

    it("3. Publish App and validate loading functionalty", function () {
      _.deployMode.DeployApp();
      //eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(2000);
      cy.get(widgetsPage.widgetBtn).first().click({ force: true });
      cy.wait("@postExecute").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.get(publish.inputWidget + " " + "input")
        .first()
        .invoke("attr", "value")
        .should("contain", "7");
    });
  },
);
