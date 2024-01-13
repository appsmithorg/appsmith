import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const testdata = require("../../../../fixtures/testdata.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe(
  "Binding the API with pageOnLoad and input Widgets",
  { tags: ["@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("MultipleInput");
    });

    it("1. Will load an api on load", function () {
      _.apiPage.CreateAndFillApi(
        testdata.baseUrl + testdata.methods,
        "PageLoadApi",
      );
      _.apiPage.ToggleOnPageLoadRun(true);
      _.agHelper.RefreshPage();
      _.apiPage.ResponseStatusCheck("200 OK"); //Verify if api is run on pageload!
    });

    it("2. Input widget updated with deafult data", function () {
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);
      cy.get(widgetsPage.defaultInput).type("3");

      cy.wait("@updateLayout")
        .its("response.body.responseMeta.status")
        .should("eq", 200);
      cy.get(publish.inputWidget + " " + "input")
        .first()
        .invoke("attr", "value")
        .should("contain", "3");
    });

    it("3. Binding second input widget with API on PageLoad data and default data from input1 widget ", function () {
      EditorNavigation.SelectEntityByName("Input3", EntityType.Widget);
      cy.get(widgetsPage.defaultInput).type(testdata.pageloadBinding, {
        parseSpecialCharSequences: false,
      });
      cy.wait("@updateLayout")
        .its("response.body.responseMeta.status")
        .should("eq", 200);

      _.deployMode.DeployApp();
      cy.get(publish.inputWidget + " " + "input")
        .first()
        .invoke("attr", "value")
        .should("contain", "3");
      cy.get(publish.inputWidget + " " + "input")
        .last()
        .invoke("attr", "value")
        .should("contain", "23");
    });
  },
);
