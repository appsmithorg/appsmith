import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const jsEditor = ObjectsRegistry.JSEditor,
  agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  locator = ObjectsRegistry.CommonLocators,
  deployMode = ObjectsRegistry.DeployMode;

describe("Multiple rejection of confirmation for onPageLoad function execution", function() {
  before(() => {
    ee.DragDropWidgetNVerify("buttonwidget", 300, 300);
  });
  it("Works properly", function() {
    const FUNCTIONS_SETTINGS_DEFAULT_DATA = [
      {
        name: "myFun1",
        onPageLoad: true,
        confirmBeforeExecute: true,
      },
      {
        name: "myFun2",
        onPageLoad: true,
        confirmBeforeExecute: true,
      },
      {
        name: "myFun3",
        onPageLoad: true,
        confirmBeforeExecute: true,
      },
    ];

    const numOfOnLoadAndConfirmExecutionActions = FUNCTIONS_SETTINGS_DEFAULT_DATA.filter(
      (setting) => setting.confirmBeforeExecute && setting.onPageLoad,
    ).length;

    jsEditor.CreateJSObject(
      `export default {
  	${FUNCTIONS_SETTINGS_DEFAULT_DATA[0].name}: async ()=>{
  		return 1
  	},
      ${FUNCTIONS_SETTINGS_DEFAULT_DATA[1].name}: async ()=>{
        return 1
    },
    ${FUNCTIONS_SETTINGS_DEFAULT_DATA[2].name}: async ()=>{
        return 1
    }
  }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        prettify: false,
      },
    );

    // Switch to settings tab
    agHelper.GetNClick(jsEditor._settingsTab);
    // Add settings for each function (according to data)
    Object.values(FUNCTIONS_SETTINGS_DEFAULT_DATA).forEach(
      (functionSetting) => {
        jsEditor.EnableDisableAsyncFuncSettings(
          functionSetting.name,
          functionSetting.onPageLoad,
          functionSetting.confirmBeforeExecute,
        );
        agHelper.Sleep(2000);
      },
    );

    deployMode.DeployApp();
    // For as many as the number of actions set to run on page load and should confirm before running,
    // Expect to see confirmation dialogs.
    for (let i = 0; i < numOfOnLoadAndConfirmExecutionActions; i++) {
      agHelper.AssertContains("Confirmation Dialog");
      agHelper.ClickButton("No");
      agHelper.Sleep(3000);
    }
  });
});
