import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const publish = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe(
  "Binding the input Widget with tab Widget",
  { tags: ["@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("tabInputDsl");
    });

    it("1. Input widget test with default value from tab widget", function () {
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);

      cy.testJsontext("defaultvalue", testdata.tabBinding + "}}");

      cy.wait("@updateLayout").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
    });

    it("2. validation of data displayed in input widgets based on tab selected", function () {
      _.deployMode.DeployApp();
      cy.get(publish.tabWidget)
        .contains("Tab 2")
        .click()
        .wait(1000)
        .should("have.class", "is-selected");
      cy.get(publish.inputWidget + " " + "input")
        .first()
        .invoke("attr", "value")
        .should("contain", "Tab 2");
      cy.get(publish.tabWidget)
        .contains("Tab 1")
        .click()
        .wait(1000)
        .should("have.class", "is-selected");
      cy.get(publish.inputWidget + " " + "input")
        .first()
        .invoke("attr", "value")
        .should("contain", "Tab 1");
    });
  },
);
