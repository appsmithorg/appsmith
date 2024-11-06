import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const widgetsPage = require("../../../../../locators/Widgets.json");
const jsonform = require("../../../../../locators/jsonFormWidget.json");
const {
  deployMode,
  propPane,
} = require("../../../../../support/Objects/ObjectsCore");

describe(
  "JsonForm widget basis c usecases",
  { tags: ["@tag.Widget", "@tag.JSONForm", "@tag.Sanity", "@tag.Binding"] },
  function () {
    before(() => {
      cy.dragAndDropToCanvas("jsonformwidget", { x: 200, y: 200 });
      cy.fixture("TestDataSet1").then(function (dataSet) {
        cy.openPropertyPane("jsonformwidget");
        propPane.EnterJSContext(
          "Source data",
          JSON.stringify(dataSet.defaultSource),
          true,
        );
        cy.get(widgetsPage.jsonFormWidget).should("have.length", 1);
      });
    });

    it("json form widget validate default data", function () {
      cy.openPropertyPane("jsonformwidget");
      cy.get(jsonform.jsformInput).should(
        "have.value",
        this.dataSet.defaultSource.name,
      );
      cy.get(jsonform.jsformDOB).should(
        "have.value",
        this.dataSet.defaultSource.date_of_birth,
      );
      cy.get(".t--jsonformfield-employee_id input").should(
        "have.value",
        this.dataSet.defaultSource.employee_id,
      );
    });

    it("json form widget validate reset button function", function () {
      deployMode.DeployApp();
      cy.get(jsonform.jsformInput).clear({ force: true });
      cy.get(jsonform.jsformInput).type("TestReset");
      cy.get(jsonform.jsformEmpID).clear({ force: true });
      cy.get(jsonform.jsformEmpID).type("375");
      cy.get(jsonform.jsformInput).should(
        "not.have.value",
        this.dataSet.defaultSource.name,
      );
      cy.get(jsonform.jsformEmpID).should(
        "not.have.value",
        this.dataSet.defaultSource.employee_id,
      );
      cy.get("button:contains('Reset')").click({ force: true });
      cy.get(jsonform.jsformInput).should(
        "have.value",
        this.dataSet.defaultSource.name,
      );
      cy.get(jsonform.jsformEmpID).should(
        "have.value",
        this.dataSet.defaultSource.employee_id,
      );
      deployMode.NavigateBacktoEditor();
    });

    it("Validate copy/paste/delete widget ", function () {
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
      //copy and paste
      cy.openPropertyPane("jsonformwidget");
      cy.get("body").type(`{${modifierKey}}c`);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.get("body").click();
      cy.get("body").type(`{${modifierKey}}v`, { force: true });
      cy.wait("@updateLayout").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.get(widgetsPage.jsonFormWidget).should("have.length", 2);
      cy.deleteWidget(widgetsPage.jsonFormWidget);
      cy.get(widgetsPage.jsonFormWidget).should("have.length", 1);
    });
  },
);
