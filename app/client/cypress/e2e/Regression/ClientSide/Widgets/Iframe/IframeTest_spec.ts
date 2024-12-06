import {
  agHelper,
  locators,
  propPane,
  deployMode,
  homePage,
} from "../../../../../support/Objects/ObjectsCore";

import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Iframe widget Tests",
  { tags: ["@tag.Widget", "@tag.Iframe", "@tag.Binding"] },
  function () {
    before(() => {
      homePage.ImportApp("IframeWidgetPostMessage.json");
    });

    const getIframeBody = (i: number) => {
      return cy
        .get(".t--draggable-iframewidget iframe")
        .eq(i)
        .its("0.contentDocument.body")
        .should("not.be.empty")
        .then(cy.wrap);
    };

    it("1. Verify content and user interaction", function () {
      EditorNavigation.SelectEntityByName("Iframe2", EntityType.Widget);
      getIframeBody(1)
        .find(".navbar__logo > img")
        .eq(0)
        .should("have.attr", "src")
        .and("include", "logo");

      // Title
      propPane.UpdatePropertyFieldValue("Title", "Test Title");
      agHelper.AssertAttribute(
        ".t--draggable-iframewidget iframe",
        "title",
        "Test Title",
        1,
      );

      // User interaction - Click
      getIframeBody(1).find(locators._pageHeaderToggle).click({ force: true });
      getIframeBody(1).find(locators._pageHeaderMenuList).should("be.visible");
    });

    it("2. Verify colors, borders and shadows", () => {
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
      agHelper.AssertCSS("iframe", "border-radius", "0px", 1);
      agHelper.AssertCSS(
        "iframe",
        "box-shadow",
        "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
        1,
      );
      deployMode.NavigateBacktoEditor();
    });

    it("3. Verify onMessageReceived, onSrcDocChanged, onURLChanged", function () {
      EditorNavigation.SelectEntityByName("Iframe1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("URL", " ");
      agHelper.ValidateToastMessage("url updated");

      agHelper.ClickButton("Submit");
      getIframeBody(0)
        .find("input")
        .should("be.visible")
        .invoke("val")
        .then((inputValue) => {
          expect(inputValue).to.equal("submitclicked");
        });

      propPane.UpdatePropertyFieldValue(
        "srcDoc",
        `<!DOCTYPE html>
            <html lang="en">
            <head></head>
            <body></body>
            </html>`,
      );
      agHelper.ValidateToastMessage("src updated");
    });
  },
);
