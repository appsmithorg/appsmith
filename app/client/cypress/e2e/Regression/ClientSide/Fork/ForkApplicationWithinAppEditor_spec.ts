import * as _ from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

let forkedApplicationDsl;
let parentApplicationDsl: any;

describe("Fork application across workspaces", function () {
  before(() => {
    _.agHelper.AddDsl("basicDsl");
  });

  it("1. Signed user should be able to fork a public forkable app & Check if the forked application has the same dsl as the original", function () {
    const appname: string =
      localStorage.getItem("workspaceName") || "randomApp";
    EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);

    cy.intercept("PUT", "/api/v1/layouts/*/pages/*").as("inputUpdate");
    _.propPane.TypeTextIntoField("defaultvalue", "A");
    cy.wait("@inputUpdate").then((response) => {
      response.response &&
        (parentApplicationDsl = response.response.body.data.dsl);
    });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    _.homePage.NavigateToHome();
    _.homePage.FilterApplication(appname);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.get(_.homePage._applicationCard).first().trigger("mouseover");
    cy.get(_.homePage._appEditIcon).first().click({ force: true });

    cy.get(_.homePage._applicationName).click({ force: true });
    cy.contains("Fork application").click({ force: true });

    cy.get(_.locators._forkAppToWorkspaceBtn).click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting

    cy.wait("@postForkAppWorkspace")
      .its("response.body.responseMeta.status")
      .should("eq", 200);
    // check that forked application has same dsl
    cy.get("@getPage")
      .its("response.body.data")
      .then((data) => {
        forkedApplicationDsl = data.layouts[0].dsl;
        expect(JSON.stringify(forkedApplicationDsl)).to.contain(
          JSON.stringify(parentApplicationDsl),
        );
      });
  });
});
