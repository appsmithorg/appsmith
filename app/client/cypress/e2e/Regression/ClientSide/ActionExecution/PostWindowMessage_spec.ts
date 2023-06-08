import {
  agHelper,
  locators,
  entityExplorer,
  propPane,
  deployMode,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";

describe("Post window message", () => {
  it("1. Posts message to an iframe within Appsmith", () => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 200, 200);
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.IFRAME, 200, 300);

    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.SelectPlatformFunction("onClick", "Post message");
    agHelper.EnterActionValue("Message", "After postMessage");
    agHelper.EnterActionValue("Target iframe", "Iframe1");

    entityExplorer.SelectEntityByName("Iframe1", "Widgets");
    propPane.UpdatePropertyFieldValue(
      "srcDoc",
      `<!doctype html>
      <html lang="en">
      <head>
      <meta charset="UTF-8"><title>post msg</title>
      </head>
      <body>
      <button id="iframe-button" onclick="sendMsg()">Send message</button>
			<button id='txtMsg'>Before postMessage</button>
      <script>
      function sendMsg() {
      window.parent.postMessage("got msg", "*");
      }
      window.addEventListener("message", (e) => {
			 document.querySelector('#txtMsg').innerHTML = e.data;
      });
      </script>
      </body>
      </html>`,
    );
    propPane.SelectPlatformFunction("onMessageReceived", "Show alert");
    agHelper.EnterActionValue("Message", "I got a message from iframe");
    deployMode.DeployApp(locators._spanButton("Submit"));
    agHelper.AssertElementVisible("#iframe-Iframe1");
    agHelper.Sleep(5000); //allowing time for elements to load fully before clicking - for CI flaky
    cy.get("#iframe-Iframe1").then((element) => {
      element.contents().find("body").find("#iframe-button").click();
    });
    agHelper.ValidateToastMessage("I got a message from iframe");

    cy.get("#iframe-Iframe1").then(($element) => {
      const $body = $element.contents().find("body");
      cy.wrap($body).find("#txtMsg").should("have.text", "Before postMessage");
    });

    agHelper.ClickButton("Submit");
    cy.get("#iframe-Iframe1").then(($element) => {
      const $body = $element.contents().find("body");
      cy.wrap($body).find("#txtMsg").should("have.text", "After postMessage");
    });
    deployMode.NavigateBacktoEditor();
  });
});
