import reconnectDatasourceModal from "../../../../locators/ReconnectLocators";
import {
  agHelper,
  homePage,
  locators,
  gitSync,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

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

const JSInput2TestCode =
  "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1: () => {\n\t\t//write code here\n\t},\n\t\n\t\n\t\n\t\n\t\n\t\n\t\n\t\n\t\n\t\n\t\n\t\n\t\n\t\n\t\n\t\n\t\n\t\n\t\n}";

let repoName;

describe(
  "1. CommandClickNavigation",
  { tags: ["@tag.IDE", "@tag.PropertyPane"] },
  function () {
    it("1. Import application & Assert few things", () => {
      homePage.NavigateToHome();
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
          agHelper.Sleep(2000);
        } else {
          homePage.AssertImportToast();
        }
      });

      //Assert link and and style
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget, {}, [
        "Container1",
      ]);

      cy.updateCodeInput(
        ".t--property-control-text",
        "{{ Graphql_Query.data }}",
      );

      cy.get(`[${NAVIGATION_ATTRIBUTE}="Graphql_Query"]`)
        .should("have.length", 1)
        .should("have.text", "Graphql_Query")
        .realHover()
        .should("have.css", "cursor", "text");

      // TODO how to hover with cmd or ctrl to assert pointer?

      // Assert navigation only when cmd or ctrl is pressed

      agHelper.Sleep();
      cy.get(`[${NAVIGATION_ATTRIBUTE}="Graphql_Query"]`).click({
        force: true,
      });
      cy.url().should("not.contain", "/api/");

      cy.get(`[${NAVIGATION_ATTRIBUTE}="Graphql_Query"]`).click({
        ctrlKey: true,
        force: true,
      });

      cy.url().should("contain", "/api/");

      //Assert working on url field
      cy.updateCodeInput(
        ".t--dataSourceField",
        "http://host.docker.internal:5001/{{ SQL_Query.data }}",
      );
      agHelper.Sleep();

      cy.get(`[${NAVIGATION_ATTRIBUTE}="SQL_Query"]`)
        .should("have.length", 1)
        .click({ cmdKey: true, force: true });

      cy.url().should("contain", "/queries/");
    });

    it("2. Will open & close modals ", () => {
      cy.updateCodeInput(
        ".t--actionConfiguration\\.body",
        "SELECT * from {{ Button3.text }}",
      );
      agHelper.Sleep();
      cy.get(`[${NAVIGATION_ATTRIBUTE}="Button3"]`)
        .should("have.length", 1)
        .click({ cmdKey: true });

      cy.url().should("not.contain", "/queries/");

      //CLose modal
      cy.updateCodeInput(
        `${locators._propertyControl}tooltip`,
        "{{ Image1.image }}",
      );

      // TODO: Debug why image1 data-navigate-to wasn't found
      // cy.get(`[${NAVIGATION_ATTRIBUTE}="Image1"]`)
      //   .should("have.length", 1)
      //   .click({ cmdKey: true });
    });

    it("3. Will navigate to specific JS Functions", () => {
      // It was found that when having git connected,
      // cmd clicking to JS function reloaded the app. Will assert that does not happen
      cy.generateUUID().then((uid) => {
        const repoName = uid;
        gitSync.CreateNConnectToGit(repoName);
        gitSync.CreateGitBranch(repoName);
      });

      cy.get("@gitRepoName").then((repName) => {
        repoName = repName;
      });

      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget, {}, [
        "Container1",
      ]);
      cy.updateCodeInput(
        ".t--property-control-text",
        "{{ JSObject1.myFun1() }}",
      );

      agHelper.Sleep();

      cy.get(`[${NAVIGATION_ATTRIBUTE}="JSObject1.myFun1"]`).click({
        cmdKey: true,
        force: true,
      });

      cy.assertCursorOnCodeInput(".js-editor", { ch: 1, line: 3 });
      agHelper.Sleep();

      // Assert context switching works when going back to canvas
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);

      cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
      cy.get(".t--property-pane-title").should("contain", "Text1");

      // Go back to JS editor
      cy.get(`[${NAVIGATION_ATTRIBUTE}="JSObject1.myFun1"]`).click({
        ctrlKey: true,
      });
    });

    it("4. Will navigate within Js Object properly", () => {
      cy.updateCodeInput(".js-editor", JSInputTestCode);
      agHelper.Sleep(2000);
      cy.get(`[${NAVIGATION_ATTRIBUTE}="JSObject1.myVar1"]`).click({
        ctrlKey: true,
      });
      cy.getCodeInput(".js-editor").then((input) => {
        const codeMirrorInput = input[0].CodeMirror;
        codeMirrorInput.focus();
      });
      cy.assertCursorOnCodeInput(".js-editor", { ch: 2, line: 1 });
      agHelper.Sleep();
      cy.get(`[${NAVIGATION_ATTRIBUTE}="JSObject1.myFun1"]`).click({
        ctrlKey: true,
      });
      cy.getCodeInput(".js-editor").then((input) => {
        const codeMirrorInput = input[0].CodeMirror;
        codeMirrorInput.focus();
      });

      cy.assertCursorOnCodeInput(".js-editor", { ch: 2, line: 2 });
      agHelper.Sleep();
      cy.get(`[${NAVIGATION_ATTRIBUTE}="JSObject2.myFun1"]`).click({
        ctrlKey: true,
      });

      cy.getCodeInput(".js-editor").then((input) => {
        const codeMirrorInput = input[0].CodeMirror;
        expect(codeMirrorInput.getValue()).to.equal(JSInput2TestCode);
      });
    });

    // Functionality isn't implemented yet
    // it("5. Will work with string arguments in framework functions", () => {
    //   entityExplorer.ExpandCollapseEntity("Widgets");
    // EditorNavigation.SelectEntityByName("Button1", EntityType.Widget, {}, ["Container1"]);
    //   cy.get(PROPERTY_SELECTOR.onClick).find(".t--js-toggle").click();
    //   cy.updateCodeInput(
    //     PROPERTY_SELECTOR.onClick,
    //     "{{ resetWidget('Input1') }}",
    //   );
    //   agHelper.Sleep();
    //   cy.get(`[${NAVIGATION_ATTRIBUTE}="Input1"]`)
    //     .should("have.length", 1)
    //     .click({ cmdKey: true });
    // });

    after(() => {
      //clean up
      gitSync.DeleteTestGithubRepo(repoName);
    });
  },
);
