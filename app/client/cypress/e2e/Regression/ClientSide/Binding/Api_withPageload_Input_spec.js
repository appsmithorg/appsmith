import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const publish = require("../../../../locators/publishWidgetspage.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe(
  "Binding the API with pageOnLoad and input Widgets",
  { tags: ["@tag.Binding"] },
  function () {
    before(() => {
      _.homePage.NavigateToHome();
      _.homePage.ImportApp("Api_withPageload_Input_TestData.json");
    });

    it("1. Will load an api on load", function () {
      EditorNavigation.SelectEntityByName("PageLoadApi", EntityType.Query);
      _.agHelper.RefreshPage();
      _.apiPage.ResponseStatusCheck("200 OK"); //Verify if api is run on pageload!
    });

    it("2. Input widget updated with deafult data", function () {
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);
      cy.get(publish.inputWidget + " " + "input")
        .first()
        .invoke("attr", "value")
        .should("contain", "3");
    });

    it("3. Binding second input widget with API on PageLoad data and default data from input1 widget ", function () {
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
