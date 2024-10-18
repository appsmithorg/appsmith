import {
  agHelper,
  locators,
  entityExplorer,
  propPane,
  deployMode,
} from "../../../../../support/Objects/ObjectsCore";

import testdata from "../../../../../fixtures/testdata.json";

describe(
  "Iframe widget Tests",
  { tags: ["@tag.Widget", "@tag.Iframe", "@tag.Binding"] },
  function () {
    before(() => {
      entityExplorer.DragDropWidgetNVerify("iframewidget", 550, 100);
    });

    const srcDoc = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Simple Iframe Widget Test</title>
    </head>
    <body>
        <!-- Your iframe widget with a simple srcdoc content -->
        <iframe srcdoc="<html><body><p>This is a simple srcdoc content.</p></body></html>" style="border: 2px solid red;"></iframe>
    </body>
    </html>`;

    const getIframeBody = () => {
      return cy
        .get(".t--draggable-iframewidget iframe")
        .its("0.contentDocument.body")
        .should("not.be.empty")
        .then(cy.wrap);
    };

    it("1. Verify content and user interaction", function () {
      propPane.UpdatePropertyFieldValue("URL", testdata.iframeUrl);
      getIframeBody()
        .find(".header-logo")
        .should("have.attr", "href", testdata.iframeUrlSubstring);

      // Title
      propPane.UpdatePropertyFieldValue("Title", "Test Title");
      agHelper.AssertAttribute(
        ".t--draggable-iframewidget iframe",
        "title",
        "Test Title",
      );

      // User interaction - Click
      getIframeBody().find(locators._pageHeaderToggle).click({ force: true });
      getIframeBody().find(locators._pageHeaderMenuList).should("be.visible");
      getIframeBody().find(locators._pageHeaderToggle).click({ force: true });
      getIframeBody()
        .find(locators._pageHeaderMenuList)
        .should("not.be.visible");

      // Full screen
      getIframeBody().find(locators._enterFullScreen).click({ force: true });
      getIframeBody()
        .find(locators._dashboardContainer)
        .should(
          "have.class",
          "application-demo-new-dashboard-container-fullscreen",
        );
      getIframeBody().find(locators._exitFullScreen).click({ force: true });
      getIframeBody()
        .find(locators._dashboardContainer)
        .should(
          "not.have.class",
          "application-demo-new-dashboard-container-fullscreen",
        );
    });

    it("2. Verify onMessageReceived, onSrcDocChanged, onURLChanged", function () {
      // onMessageReceived
      propPane.SelectPlatformFunction("onMessageReceived", "Show alert");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Message"),
        "Message Received",
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);

      getIframeBody()
        .find("a:contains('Social Feed')")
        .first()
        .click({ force: true });
      agHelper.ValidateToastMessage("Message Received");

      // onSrcDocChanged
      propPane.SelectPlatformFunction("onSrcDocChanged", "Show alert");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Message"),
        "Value Changed",
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);

      propPane.UpdatePropertyFieldValue("srcDoc", srcDoc);
      agHelper.ValidateToastMessage("Value Changed");
      getIframeBody()
        .find("iframe")
        .its("0.contentDocument.body")
        .find("p")
        .should("have.text", "This is a simple srcdoc content.");

      // onURLChanged
      propPane.SelectPlatformFunction("onURLChanged", "Show alert");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Message"),
        "URL Changed",
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);

      propPane.UpdatePropertyFieldValue("URL", testdata.iframeRandomUrl);
      agHelper.ValidateToastMessage("URL Changed");
    });

    it("3. Verify colors, borders and shadows", () => {
      propPane.MoveToTab("Style");

      // Change Border Color
      propPane.SelectColorFromColorPicker("bordercolor", 10);

      // Change  border
      agHelper.GetNClick(propPane._segmentedControl("0px"));

      // Change  Box Shadow
      agHelper.GetNClick(
        `${propPane._segmentedControl("0")}:contains('Large')`,
      );

      //Verify details in Deploy mode
      deployMode.DeployApp();
      //agHelper.AssertCSS("iframe", "border-color", "rgb(185, 28, 28)");
      agHelper.AssertCSS("iframe", "border-radius", "0px");
      agHelper.AssertCSS(
        "iframe",
        "box-shadow",
        "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
      );
    });
  },
);
