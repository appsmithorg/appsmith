import {
  agHelper,
  assertHelper,
  entityExplorer,
  homePage,
  jsEditor,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import HomePage from "../../../../locators/HomePage";
import {
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

describe("Fork application with Jsobjects", {}, function () {
  //https://github.com/appsmithorg/appsmith/issues/36277
  it("1. Fork app and verify all the elements", () => {
    homePage.ImportApp("jsObjectTesting.json");
    agHelper.GetNClick(homePage._applicationName);
    agHelper.GetNClickByContains;
    agHelper.GetNClickByContains(
      HomePage.applicationEditMenu,
      "Fork application",
    );
    agHelper.GetNClick(locators._forkAppToWorkspaceBtn);
    agHelper.FailIfErrorToast("");
    assertHelper.AssertNetworkStatus("@postForkAppWorkspace", 200);
    agHelper.WaitUntilEleDisappear(homePage._forkModal);
    homePage.NavigateToHome();
    agHelper.AssertElementExist(
      `${homePage._applicationCard}:contains('JS object testing upto 1.5 MB (1)')`,
    );
    homePage.EditAppFromAppHover("JS object testing upto 1.5 MB (1)");
    PageLeftPane.switchSegment(PagePaneSegment.JS);
    for (let i = 1; i <= 11; i++) {
      agHelper.GetNClick(locators._entityTestId(`JS${i}`));
      agHelper.FailIfErrorToast("");
      agHelper.AssertAttribute(
        locators._entityTestId(`JS${i}`),
        "data-selected",
        "true",
      );
    }
    for (let i = 12; i <= 17; i++) {
      agHelper.GetNClick(locators._entityTestId(`J${i}`));
      agHelper.FailIfErrorToast("");
      agHelper.AssertAttribute(
        locators._entityTestId(`J${i}`),
        "data-selected",
        "true",
      );
    }

    jsEditor.CreateJSObject('"MiddleName": "Test",\n', {
      paste: false,
      toRun: false,
      completeReplace: false,
      shouldCreateNewJSObj: false,
      lineNumber: 5,
    });
    agHelper.GetNClick(locators._entityTestId("J16"));
    agHelper.AssertAttribute(
      locators._entityTestId("J16"),
      "data-selected",
      "true",
    );
    agHelper.GetNClick(locators._entityTestId("J17"));
    agHelper.AssertAttribute(
      locators._entityTestId("J17"),
      "data-selected",
      "true",
    );
    agHelper.GetNAssertContains(".CodeMirror-line ", '"MiddleName": "Test"');
  });
});
