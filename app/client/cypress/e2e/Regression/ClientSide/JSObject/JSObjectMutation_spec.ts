import { getWidgetSelector } from "../../../../locators/WidgetLocators";
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("JSObject testing", () => {
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
});
