import reconnectDatasourceModal from "../../../../locators/ReconnectLocators";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import { PROPERTY_SELECTOR } from "../../../../locators/WidgetLocators";

const homePage = ObjectsRegistry.HomePage;
const agHelper = ObjectsRegistry.AggregateHelper;
const commonLocators = ObjectsRegistry.CommonLocators;

const NAVIGATION_ATTRIBUTE = "data-navigate-to";

const JSInputTestCode = `export default {
  myVar1: "test",
  myFun1: () => {
    return this.myVar1;
  },
  myFun2: () => {
    return this.myFun1;
  },
  myFun3: () => {
    return JSObject2.myFun1();
  }
}`;

const JSInput2TestCode = `export default {
\tmyVar1: [],
\tmyVar2: {},
\tmyFun1: () => {
\t\t
\t\t//write code here
\t},
\t
\t
\t
\t
\t
\t
\t
\t
\t
\t
\t
\t
\t
\t
\t
\t
\t
\t
\t
}`;

describe("1. CommandClickNavigation", function() {
  it("1. Import the test application", () => {
    homePage.NavigateToHome();
    cy.intercept("GET", "/api/v1/users/features", {
      fixture: "featureFlags.json",
    }).as("featureFlags");
    cy.reload();
    homePage.ImportApp("ContextSwitching.json");
    cy.wait("@importNewApplication").then((interception) => {
      agHelper.Sleep();
      const { isPartialImport } = interception.response.body.data;
      if (isPartialImport) {
        // should reconnect modal
        cy.get(reconnectDatasourceModal.SkipToAppBtn).click({
          force: true,
        });
        cy.wait(2000);
      } else {
        homePage.AssertImportToast();
      }
    });
  });

  it("2. Assert link and and style", () => {
    cy.CheckAndUnfoldEntityItem("Queries/JS");

    cy.SearchEntityandOpen("Text1");
    cy.updateCodeInput(".t--property-control-text", "{{ Graphql_Query.data }}");

    cy.get(`[${NAVIGATION_ATTRIBUTE}="Graphql_Query"]`)
      .should("have.length", 1)
      .should("have.text", "Graphql_Query")
      .realHover()
      .should("have.css", "cursor", "text");

    // TODO how to hover with cmd or ctrl to assert pointer?
  });

  it("3. Assert navigation only when cmd or ctrl is pressed", () => {
    cy.get(`[${NAVIGATION_ATTRIBUTE}="Graphql_Query"]`).click();

    cy.url().should("not.contain", "/api/");

    cy.get(`[${NAVIGATION_ATTRIBUTE}="Graphql_Query"]`).click({
      ctrlKey: true,
    });

    cy.url().should("contain", "/api/");
  });

  it("4. Assert working on url field", () => {
    cy.updateCodeInput(
      ".t--dataSourceField",
      "https://www.test.com/{{ SQL_Query.data }}",
    );

    cy.get(`[${NAVIGATION_ATTRIBUTE}="SQL_Query"]`)
      .should("have.length", 1)
      .click({ cmdKey: true });

    cy.url().should("contain", "/queries/");
  });

  it("5. Will open modals", () => {
    cy.updateCodeInput(
      ".t--actionConfiguration\\.body",
      "SELECT * from {{ Button3.text }}",
    );
    cy.get(`[${NAVIGATION_ATTRIBUTE}="Button3"]`)
      .should("have.length", 1)
      .click({ cmdKey: true });

    cy.url().should("not.contain", "/queries/");
  });

  it("6. Will close modals", () => {
    cy.updateCodeInput(
      `${commonLocators._propertyControl}tooltip`,
      "{{ Image1.image }}",
    );

    cy.get(`[${NAVIGATION_ATTRIBUTE}="Image1"]`)
      .should("have.length", 1)
      .click({ cmdKey: true });
  });

  it("7. Will navigate to specific JS Functions", () => {
    cy.SearchEntityandOpen("Text1");
    cy.updateCodeInput(".t--property-control-text", "{{ JSObject1.myFun1() }}");

    cy.get(`[${NAVIGATION_ATTRIBUTE}="JSObject1.myFun1"]`).click({
      ctrlKey: true,
    });

    cy.assertCursorOnCodeInput(".js-editor", { ch: 1, line: 3 });
  });

  it("8. Will navigate within Js Object properly", () => {
    cy.updateCodeInput(".js-editor", JSInputTestCode);
    cy.get(`[${NAVIGATION_ATTRIBUTE}="JSObject1.myVar1"]`).click({
      ctrlKey: true,
    });
    cy.getCodeInput(".js-editor").then((input) => {
      const codeMirrorInput = input[0].CodeMirror;
      codeMirrorInput.focus();
    });
    cy.assertCursorOnCodeInput(".js-editor", { ch: 2, line: 1 });

    cy.get(`[${NAVIGATION_ATTRIBUTE}="JSObject1.myFun1"]`).click({
      ctrlKey: true,
    });
    cy.getCodeInput(".js-editor").then((input) => {
      const codeMirrorInput = input[0].CodeMirror;
      codeMirrorInput.focus();
    });

    cy.assertCursorOnCodeInput(".js-editor", { ch: 2, line: 2 });

    cy.get(`[${NAVIGATION_ATTRIBUTE}="JSObject2.myFun1"]`).click({
      ctrlKey: true,
    });

    cy.getCodeInput(".js-editor").then((input) => {
      const codeMirrorInput = input[0].CodeMirror;
      expect(codeMirrorInput.getValue()).to.equal(JSInput2TestCode);
    });
  });

  it.skip("Will work with string arguments in framework functions", () => {
    cy.get(PROPERTY_SELECTOR.onClick)
      .find(".t--js-toggle")
      .click();
    cy.updateCodeInput(
      PROPERTY_SELECTOR.onClick,
      "{{ resetWidget('Input1') }}",
    );
    cy.get(`[${NAVIGATION_ATTRIBUTE}="Input1"]`)
      .should("have.length", 1)
      .click({ cmdKey: true });
  });
});
