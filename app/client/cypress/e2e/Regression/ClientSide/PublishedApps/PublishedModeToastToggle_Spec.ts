import * as _ from "../../../../support/Objects/ObjectsCore";

const SHOW_ALERT_WORKING_BUTTON = "Show alert working";
const SHOW_ALERT_MSG = "Hello World!";
const SHOW_ALERT_NOT_WORKING_BUTTON = "Show alert not working";
const SHOW_ALERT_NOT_WORKING_MSG = "Correct_input2 is not defined";
const RUN_JS_OBJECT_BUTTON = "RUN JSOBJECT";
const RUN_JS_OBJECT_MSG = "Incorrect_users failed to execute";

const PAGE_LOAD_MSG = `The action "Incorrect_users" has failed.`;

describe.skip(
  "Published mode toggle toast with debug flag in the url",
  { tags: ["@tag.JS", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("publishedModeToastToggleDsl");
    });
    //open bug: https://github.com/appsmithorg/appsmith/issues/38165
    it.skip("1. Should not show any application related toasts", function () {
      _.apiPage.CreateAndFillApi(
        _.dataManager.dsValues[_.dataManager.defaultEnviorment].mockApiUrl,
        "Correct_users",
      );
      _.apiPage.ToggleOnPageLoadRun(true);
      _.apiPage.CreateAndFillApi(
        _.dataManager.dsValues[
          _.dataManager.defaultEnviorment
        ].mockApiUrl.replace("mock-api", "mock-api2err"),
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
      _.deployMode.DeployApp(undefined, true, true, false);

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

    //open bug: https://github.com/appsmithorg/appsmith/issues/38165
    it.skip("2. Should show all application related toasts with debug flag true in url", function () {
      cy.url().then((url) => {
        cy.visit({
          url,
          qs: {
            debug: "true",
          },
          timeout: 60000,
        });
        _.agHelper.GetNAssertContains(_.locators._toastMsg, PAGE_LOAD_MSG);

        _.agHelper.ClickButton(SHOW_ALERT_WORKING_BUTTON);
        _.agHelper.AssertContains(
          SHOW_ALERT_MSG,
          "exist",
          _.locators._toastMsg,
        );

        _.agHelper.Sleep(2000);
        _.agHelper.ClickButton(SHOW_ALERT_NOT_WORKING_BUTTON);
        _.agHelper.AssertContains(
          SHOW_ALERT_NOT_WORKING_MSG,
          "exist",
          _.locators._toastMsg,
        );

        _.agHelper.ClickButton(RUN_JS_OBJECT_BUTTON);
        _.agHelper.AssertContains(
          "Hello success",
          "exist",
          _.locators._toastMsg,
        );
        _.agHelper.AssertContains(
          RUN_JS_OBJECT_MSG,
          "exist",
          _.locators._toastMsg,
        );
      });
    });
  },
);
