import {
  agHelper,
  deployMode,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe("Post window message", { tags: ["@tag.JS", "@tag.Sanity"] }, () => {
  it("1. Posts message to an iframe within Appsmith", () => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 200, 200);
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.IFRAME, 200, 300);

    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.SelectPlatformFunction("onClick", "Post message");
    agHelper.EnterActionValue("Message", "After postMessage");
    agHelper.GetNClick(propPane._windowTargetDropdown);
    agHelper.GetNClick(locators._dropDownValue("Iframe1"), 0, true);

    EditorNavigation.SelectEntityByName("Iframe1", EntityType.Widget);
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
    deployMode.DeployApp(locators._buttonByText("Submit"));
    agHelper.WaitUntilEleAppear(locators._buttonByText("Submit"));
    agHelper.WaitUntilEleAppear("#iframe-Iframe1");
    agHelper.AssertElementVisibility("#iframe-Iframe1");
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
