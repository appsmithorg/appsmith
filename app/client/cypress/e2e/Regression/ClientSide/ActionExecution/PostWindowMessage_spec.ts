import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Post window message", () => {
  it("1. Posts message to an iframe within Appsmith", () => {
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.BUTTON, 200, 200);
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.IFRAME, 200, 300);

    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.SelectPlatformFunction("onClick", "Post message");
    _.agHelper.EnterActionValue("Message", "After postMessage");
    _.agHelper.EnterActionValue("Target iframe", "Iframe1");

    _.entityExplorer.SelectEntityByName("Iframe1", "Widgets");
    _.propPane.UpdatePropertyFieldValue(
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
    _.propPane.SelectPlatformFunction("onMessageReceived", "Show alert");
    _.agHelper.EnterActionValue("Message", "I got a message from iframe");
    _.deployMode.DeployApp(_.locators._spanButton("Submit"));
    _.agHelper.AssertElementVisible("#iframe-Iframe1");
    cy.get("#iframe-Iframe1").then((element) => {
      element.contents().find("body").find("#iframe-button").click();
    });
    _.agHelper.ValidateToastMessage("I got a message from iframe");

    cy.get("#iframe-Iframe1").then(($element) => {
      const $body = $element.contents().find("body");
      cy.wrap($body).find("#txtMsg").should("have.text", "Before postMessage");
    });

    _.agHelper.ClickButton("Submit");
    cy.get("#iframe-Iframe1").then(($element) => {
      const $body = $element.contents().find("body");
      cy.wrap($body).find("#txtMsg").should("have.text", "After postMessage");
    });
    _.deployMode.NavigateBacktoEditor();
  });
});
