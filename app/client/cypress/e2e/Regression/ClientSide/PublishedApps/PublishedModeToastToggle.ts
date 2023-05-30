import * as _ from "../../../../support/Objects/ObjectsCore";

const SHOW_ALERT_WORKING_BUTTON = "Show alert working";
const SHOW_ALERT_MSG = "Hello World!";
const SHOW_ALERT_NOT_WORKING_BUTTON = "Show alert not working";
const SHOW_ALERT_NOT_WORKING_MSG =
  "ReferenceError: Correct_input2 is not defined";
const RUN_JS_OBJECT_BUTTON = "RUN JSOBJECT";
const RUN_JS_OBJECT_MSG =
  "UncaughtPromiseRejection: Incorrect_users failed to execute";

describe("Published mode toggle toast with debug flag in the url", function () {
  before(() => {
    cy.fixture("publishedModeToastToggleDsl").then((val) => {
      _.agHelper.AddDsl(val);
    });
  });

  it("Should not show any application related toasts", function () {
    _.apiPage.CreateAndFillApi(
      "https://mock-api.appsmith.com/users",
      "Correct_users",
    );
    _.apiPage.ToggleOnPageLoadRun(true);
    _.apiPage.CreateAndFillApi(
      "https://mock-api.appsmith.com/users2",
      "Incorrect_users",
    );
    _.apiPage.ToggleOnPageLoadRun(true);
    _.jsEditor.CreateJSObject(
      `export default {
      async myFun1 () {
        const res = await Correct_users.run();
        showAlert("Hello info", "info");
        showAlert("Hello error", "error");
        showAlert("Hello warning", "warning");
        showAlert("Hello success", "success");
        await Incorrect_users.run();
        return res;
      }
    }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );
    _.deployMode.DeployApp();

    _.agHelper.AssertElementAbsence(_.locators._toastMsg);

    _.agHelper.ClickButton(SHOW_ALERT_WORKING_BUTTON);
    _.agHelper.AssertContains(SHOW_ALERT_MSG, "exist", _.locators._toastMsg);

    _.agHelper.ClickButton(SHOW_ALERT_NOT_WORKING_BUTTON);
    _.agHelper.AssertContains(
      SHOW_ALERT_NOT_WORKING_MSG,
      "not.exist",
      _.locators._toastMsg,
    );

    _.agHelper.ClickButton(RUN_JS_OBJECT_BUTTON);
    _.agHelper.AssertContains("Hello success", "exist", _.locators._toastMsg);
    _.agHelper.AssertContains(
      RUN_JS_OBJECT_MSG,
      "not.exist",
      _.locators._toastMsg,
    );
  });

  it("Should show all application related toasts with debug flag true in url", function () {
    cy.url().then((url) => {
      cy.visit({
        url,
        qs: {
          debug: "true",
        },
      });
      _.agHelper.GetNAssertContains(
        _.locators._toastMsg,
        /The action "Incorrect_users" has failed./g,
      );

      _.agHelper.ClickButton(SHOW_ALERT_WORKING_BUTTON);
      _.agHelper.AssertContains(SHOW_ALERT_MSG, "exist", _.locators._toastMsg);

      _.agHelper.ClickButton(SHOW_ALERT_NOT_WORKING_BUTTON);
      _.agHelper.AssertContains(
        SHOW_ALERT_NOT_WORKING_MSG,
        "exist",
        _.locators._toastMsg,
      );

      _.agHelper.ClickButton(RUN_JS_OBJECT_BUTTON);
      _.agHelper.AssertContains("Hello success", "exist", _.locators._toastMsg);
      _.agHelper.AssertContains(
        RUN_JS_OBJECT_MSG,
        "exist",
        _.locators._toastMsg,
      );
    });
  });
});
