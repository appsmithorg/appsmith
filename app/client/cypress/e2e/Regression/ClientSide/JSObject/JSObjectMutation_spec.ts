import { getWidgetSelector } from "../../../../locators/WidgetLocators";
import { locators } from "../../../../support/Objects/ObjectsCore";
import * as _ from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
const commonlocators = require("../../../../locators/commonlocators.json");

describe("JSObject testing", { tags: ["@tag.JS", "@tag.Binding"] }, () => {
  before(() => {
    _.homePage.NavigateToHome();
    _.homePage.ImportApp("JSObjectMutationTestApp.json");
    _.homePage.AssertImportToast();
  });

  it("1. Number increment and decrement", function () {
    _.agHelper.ClickButton("ADD");
    _.agHelper.ClickButton("ADD");
    _.agHelper.ClickButton("ADD");
    _.agHelper
      .GetText(`${getWidgetSelector(_.draggableWidgets.TEXT)} span`)
      .then(($label) => {
        expect($label).to.equal("4");
      });

    _.agHelper.Sleep(400);
    _.agHelper.ClickButton("SUB");
    _.agHelper.ClickButton("SUB");
    _.agHelper
      .GetText(`${getWidgetSelector(_.draggableWidgets.TEXT)} span`)
      .then(($label) => {
        expect($label).to.equal("2");
      });
  });

  it("2. Array push and pop", function () {
    // open the select widget
    _.agHelper.SelectDropDown("ARRAY");

    _.agHelper.ClickButton("ADD");
    _.agHelper.ClickButton("ADD");
    _.agHelper.ClickButton("ADD");

    _.agHelper
      .GetText(`${getWidgetSelector(_.draggableWidgets.TEXT)} span`)
      .then(($label) => {
        expect($label).contains("[  0,  1,  2]");
      });
  });

  it("3. Object property addition and deletion", function () {
    _.agHelper.SelectDropDown("OBJECT");
    _.agHelper.ClickButton("ADD");
    _.agHelper
      .GetText(`${getWidgetSelector(_.draggableWidgets.TEXT)} span`)
      .then(($label) => {
        expect($label).contains('{  "a": {    "b": 1  }}');
      });
  });

  it("4. Map property addition and deletion", function () {
    _.agHelper.SelectDropDown("MAP");

    _.agHelper.ClickButton("ADD");
    _.agHelper.ClickButton("ADD");
    _.agHelper
      .GetText(`${getWidgetSelector(_.draggableWidgets.TEXT)} span`)
      .then(($label) => {
        expect($label).contains('[  [    "a",    1  ]]');
      });

    _.agHelper.ClickButton("SUB");
    _.agHelper.ClickButton("SUB");
    _.agHelper
      .GetText(`${getWidgetSelector(_.draggableWidgets.TEXT)} span`)
      .then(($label) => {
        expect($label).contains("[]");
      });
  });

  it("5. Set property addition and deletion", function () {
    _.agHelper.SelectDropDown("SET");

    _.agHelper.ClickButton("ADD");
    _.agHelper
      .GetText(`${getWidgetSelector(_.draggableWidgets.TEXT)} span`)
      .then(($label) => {
        expect($label).contains("[  0]");
      });

    _.agHelper.ClickButton("SUB");
    _.agHelper
      .GetText(`${getWidgetSelector(_.draggableWidgets.TEXT)} span`)
      .then(($label) => {
        expect($label).contains("[]");
      });
  });

  it("6. Bug 27978 Check assignment should not get overridden by evaluation", () => {
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TEXT, 400, 400);
    _.propPane.TypeTextIntoField(
      "Text",
      `{{JSObject1.data.length ? 'id-' + JSObject1.data[0].id : 'Not Set' }}`,
      true,
      false,
    );
    _.apiPage.CreateAndFillApi(
      _.dataManager.dsValues[_.dataManager.defaultEnviorment].mockApiUrl,
    );
    const JS_OBJECT_BODY = `export default {
      data: [],
      async getData() {
        await Api1.run()
        return Api1.data
      },
      async myFun1() {
        this.data = await this.getData();
        console.log(this.data);
      },
      async myFun2() {
        const data = await this.getData();
        data.push({ name: "test123" })
        this.data = data;
        console.log(this.data);
      },
    }`;
    _.jsEditor.CreateJSObject(JS_OBJECT_BODY, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });
    _.agHelper.GetNAssertContains(_.jsEditor._funcDropdownValue, "getData");
    _.jsEditor.SelectFunctionDropdown("myFun1");
    _.jsEditor.RunJSObj();
    EditorNavigation.SelectEntityByName("Text2", EntityType.Widget);
    _.agHelper.AssertContains("id-1");
    _.agHelper.RefreshPage();
    _.agHelper.AssertContains("Not Set");
    EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);
    _.jsEditor.SelectFunctionDropdown("myFun2");
    _.jsEditor.RunJSObj();
    EditorNavigation.SelectEntityByName("Text2", EntityType.Widget);
    _.agHelper.AssertContains("id-1");
  });
});
