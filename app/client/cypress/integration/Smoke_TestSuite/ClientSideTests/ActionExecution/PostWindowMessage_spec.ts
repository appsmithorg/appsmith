import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import { WIDGET } from "../../../../locators/WidgetLocators";

const {
  AggregateHelper: agHelper,
  CommonLocators: locator,
  DeployMode: deployMode,
  EntityExplorer: ee,
  PropertyPane: propPane,
} = ObjectsRegistry;

describe("Post window message", () => {
  it("1. Posts message to an iframe within Appsmith", () => {
    ee.DragDropWidgetNVerify(WIDGET.BUTTON, 200, 200);
    ee.DragDropWidgetNVerify(WIDGET.IFRAME, 200, 300);

    ee.SelectEntityByName("Button1", "Widgets");
    propPane.SelectPropertiesDropDown("onClick", "Post message");
    cy.get("[data-testid=Message-code-wrapper]").within(() => {
      cy.get(".CodeEditorTarget").type("hello world!");
    });
    cy.get("[data-testid=Target-iframe-code-wrapper]").within(() => {
      cy.get(".CodeMirror textarea")
        .first()
        .focus()
        .type("{ctrl}{uparrow}", { force: true })
        .type("{ctrl}{shift}{downarrow}", { force: true });
      cy.focused().then(() => {
        cy.get(".CodeMirror textarea")
          .first()
          .click({ force: true })
          .focused()
          .clear({
            force: true,
          })
          .type("Iframe1");
      });
    });

    ee.SelectEntityByName("Iframe1", "Widgets");
    propPane.TypeTextIntoField(
      "srcDoc",
      `<!doctype html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
          </head>
          <body>
          <button id="iframe-button" onclick="sendMsg()">Send message</button>
          <script>
            function sendMsg() {
            window.parent.postMessage("got msg", "*");
            }
            window.addEventListener("message", (e) => {
                alert(e.data);
            });
          </script>
          </body>
          </html>`,
    );
    propPane.SelectPropertiesDropDown("onMessageReceived", "Show message");
    cy.get("[data-testid=Message-code-wrapper]").within(() => {
      cy.get(".CodeEditorTarget").type("I got a message from iframe");
    });

    deployMode.DeployApp();
    cy.get("#iframe-Iframe1").then((element) => {
      const body = element.contents().find("body");
      body.find("#iframe-button").click();
    });

    agHelper.ValidateToastMessage("I got a message");

    agHelper.ClickButton("Submit");
    cy.on("window:alert", (str) => {
      expect(str).to.equal("hello world!");
    });

    deployMode.NavigateBacktoEditor();
  });
});
