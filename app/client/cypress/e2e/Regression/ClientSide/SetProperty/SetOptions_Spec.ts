import {
  agHelper,
  apiPage,
  dataManager,
  deployMode,
  draggableWidgets,
  entityExplorer,
  jsEditor,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Widget Property Setters - Part III - Tc #2409 - Validates SetOptions",
  { tags: ["@tag.Widget", "@tag.JS", "@tag.Binding"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.INPUT_V2, 300);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.SELECT, 300, 200);
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Default value", "{{Select1.options}}");
    });

    it("1. Set Widget property to unaccepted values & verify debug error", () => {
      //SetOptions to not acceptable value - Boolean
      jsEditor.CreateJSObject(
        `export default {
        myFun1 () {
          Select1.setOptions(false);
        }
      }`,
        {
          completeReplace: true,
        },
      );
      jsEditor.RunJSObj();
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      agHelper
        .GetText(
          locators._widgetInDeployed(draggableWidgets.INPUT_V2) +
            " " +
            locators._input,
          "val",
        )
        .then((val) => {
          expect(val).to.eq("false");
        });

      //SetOptions to not acceptable value - Numeric
      EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);
      jsEditor.EditJSObj(
        `export default {
        myFun1 () {
          Select1.setOptions(1234);
        }
      }`,
        false,
      );
      jsEditor.RunJSObj();
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      agHelper
        .GetText(
          locators._widgetInDeployed(draggableWidgets.INPUT_V2) +
            " " +
            locators._input,
          "val",
        )
        .then((val) => {
          expect(val).to.eq("1234");
        });

      //SetOptions to not acceptable value - String
      EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);
      jsEditor.EditJSObj(
        `export default {
        myFun1 () {
          Select1.setOptions('fdfjhgf7');
        }
      }`,
        false,
      );
      jsEditor.RunJSObj();
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      agHelper
        .GetText(
          locators._widgetInDeployed(draggableWidgets.INPUT_V2) +
            " " +
            locators._input,
          "val",
        )
        .then((val) => {
          expect(val).to.eq("fdfjhgf7");
        });

      //SetOptions to not acceptable value - undefined
      EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);
      jsEditor.EditJSObj(
        `export default {
        myFun1 () {
          Select1.setOptions(undefined);
        }
      }`,
        false,
      );
      jsEditor.RunJSObj();
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      agHelper
        .GetText(
          locators._widgetInDeployed(draggableWidgets.INPUT_V2) +
            " " +
            locators._input,
          "val",
        )
        .then((val) => {
          expect(val).to.eq("fdfjhgf7");
        });

      //SetOptions to not acceptable value - null
      EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);
      jsEditor.EditJSObj(
        `export default {
        myFun1 () {
          Select1.setOptions(null);
        }
      }`,
        false,
      );
      jsEditor.RunJSObj();
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      agHelper
        .GetText(
          locators._widgetInDeployed(draggableWidgets.INPUT_V2) +
            " " +
            locators._input,
          "val",
        )
        .then((val) => {
          expect(val).to.be.empty;
        });

      //unabel to set +ve value to setOptions:
      // {{JSObject1.myFun1.data.map((item)=>{return{
      //   label: item.name,
      //     value: item.email									}	})}}
      // deployMode.DeployApp();
    });

    it("2.  Update 'setOptions' property By JS function & By action selector", () => {
      EditorNavigation.SelectEntityByName("Select1", EntityType.Widget);
      propPane.EnterJSContext("Source Data", ""); // By JS function
      EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);
      jsEditor.EditJSObj(`export default {
      myFun1 () {
        Select1.setOptions([{label: 'monday', value: 'weekday'}])
        }
    }`);
      jsEditor.RunJSObj();
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      agHelper
        .GetText(
          locators._widgetInDeployed(draggableWidgets.INPUT_V2) +
            " " +
            locators._input,
          "val",
        )
        .then((val) => {
          expect(val).to.include("monday").and.to.include("weekday");
        });
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 300, 300);
      propPane.EnterJSContext("onClick", "{{JSObject1.myFun1()}}"); // By action selector
      EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);
      jsEditor.EditJSObj(`export default {
      myFun1 () {
        Select1.setOptions([{label: 'monday', value: 'weekday', code: '1'}])
        }
    }`);
      deployMode.DeployApp();
      agHelper
        .GetText(
          locators._widgetInDeployed(draggableWidgets.INPUT_V2) +
            " " +
            locators._input,
          "val",
        )
        .then((val) => {
          expect(val).to.eq("[]");
        });
      agHelper.ClickButton("Submit");
      agHelper
        .GetText(
          locators._widgetInDeployed(draggableWidgets.INPUT_V2) +
            " " +
            locators._input,
          "val",
        )
        .then((val) => {
          expect(val)
            .to.include("monday")
            .and.to.include("weekday")
            .and.to.include("1");
        });
      deployMode.NavigateBacktoEditor();
    });

    it("3. Update 'setOptions' property - during onPage load", () => {
      EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);
      jsEditor.EnableDisableAsyncFuncSettings("myFun1", true, false); //for on page load execution
      deployMode.DeployApp();
      agHelper
        .GetText(
          locators._widgetInDeployed(draggableWidgets.INPUT_V2) +
            " " +
            locators._input,
          "val",
        )
        .then((val) => {
          expect(val)
            .to.include("monday")
            .and.to.include("weekday")
            .and.to.include("1");
        });
      deployMode.NavigateBacktoEditor();
    });

    it("4. Update 'setOptions' property - during onPage load - via Promise", () => {
      EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);
      jsEditor.EditJSObj(`export default {
      myFun1 () {
        return	new Promise((resolve,reject)=>{
          Select1.setOptions([{label: 'monday', value: 'weekday'}])
        })
      }
    }`);
      deployMode.DeployApp();
      agHelper
        .GetText(
          locators._widgetInDeployed(draggableWidgets.INPUT_V2) +
            " " +
            locators._input,
          "val",
        )
        .then((val) => {
          expect(val)
            .to.include("monday")
            .and.to.include("weekday")
            .and.not.to.include("1");
        });
      deployMode.NavigateBacktoEditor();
    });

    it("5. Update 'setOptions' property - during onPage load - via CallBack", () => {
      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
      );
      EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);
      jsEditor.EditJSObj(`export default {
      async myFunc1 () {
        await Api1.run(() => {Select1.setOptions([
          {
            "label": "Api callback",
            "value": "Api callback"
          }
        ])}, () => {showAlert('unable to run API')});
      }
    }`);
      jsEditor.EnableDisableAsyncFuncSettings("myFunc1", true, false); //for on page load execution, since sync function is updated to async
      deployMode.DeployApp();
      agHelper.WaitForCondition(
        agHelper
          .GetElement(
            locators._widgetInDeployed(draggableWidgets.INPUT_V2) +
              " " +
              locators._input,
          )
          .then(($ele) => {
            return cy.wrap($ele).should("not.have.value", "[]");
          }),
      );
      agHelper
        .GetText(
          locators._widgetInDeployed(draggableWidgets.INPUT_V2) +
            " " +
            locators._input,
          "val",
        )
        .then((val) => {
          expect(val).to.include("Api callback");
        });
      deployMode.NavigateBacktoEditor();
    });

    it("6. Update 'setOptions' property - during onPage load - via contcat", () => {
      EditorNavigation.SelectEntityByName("Select1", EntityType.Widget);
      propPane.EnterJSContext(
        "Source Data",
        `[
        {
          "name": "monday",
          "code": "Weekday"
        }
      ]`,
      ); // By JS function
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.SELECT, 300, 400);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.SELECT, 300, 500);
      EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);
      jsEditor.EditJSObj(`export default {
      myFunc1 () {
        Select3.setOptions(Select1.options.concat(Select2.options));
      }
    }`);
      jsEditor.EnableDisableAsyncFuncSettings("myFunc1", true, false); //for on page load execution, since sync function is updated to async
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Default value", "{{Select3.options}}");
      deployMode.DeployApp();
      agHelper.WaitForCondition(
        agHelper
          .GetElement(
            locators._widgetInDeployed(draggableWidgets.INPUT_V2) +
              " " +
              locators._input,
          )
          .then(($ele) => {
            return cy.wrap($ele).should("include.value", "monday");
          }),
      );
      agHelper
        .GetText(
          locators._widgetInDeployed(draggableWidgets.INPUT_V2) +
            " " +
            locators._input,
          "val",
        )
        .then((val) => {
          expect(val)
            .to.include("monday")
            .and.to.include("Blue")
            .and.to.include("Red")
            .and.to.include("Green");
        });
      deployMode.NavigateBacktoEditor();
    });

    it("7. Update 'setOptions' property - via SetTimeout framework function", () => {
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Default value", "{{Select1.options}}");
      EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);
      jsEditor.EditJSObj(`export default {
      myFun1() {
        let localValue = {"label": 'local label', "value": 'local value'};
        setTimeout(() => {Select1.setOptions(localValue)}, 1000);
      }
    }`);
      jsEditor.EnableDisableAsyncFuncSettings("myFun1", false, false); //for on page load execution
      deployMode.DeployApp();
      agHelper
        .GetText(
          locators._widgetInDeployed(draggableWidgets.INPUT_V2) +
            " " +
            locators._input,
          "val",
        )
        .then((val) => {
          expect(val).to.contain("monday");
        });
      agHelper.ClickButton("Submit");
      agHelper.Sleep(); //settimeout timer, hence sleep needed here!
      agHelper.WaitForCondition(
        agHelper
          .GetText(
            locators._widgetInDeployed(draggableWidgets.INPUT_V2) +
              " " +
              locators._input,
            "val",
          )
          .then((val) => {
            expect(val).to.include("local label").and.to.include("local value");
          }),
      );
      deployMode.NavigateBacktoEditor();
    });
  },
);
