import {
  agHelper,
  locators,
  entityExplorer,
  jsEditor,
  propPane,
  apiPage,
} from "../../../../support/Objects/ObjectsCore";

describe("Assistive Binding", function () {
  before(() => {
    // Button1
    entityExplorer.DragDropWidgetNVerify("buttonwidget", 200, 200);

    // Create JSObject1
    jsEditor.CreateJSObject(
      `export default {
              myFun1: ()=>{
                  f;
                  return "yes"
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

    // Create JSObject2
    jsEditor.CreateJSObject(
      `export default {
                myFun1: ()=>{
                    f;
                    return "yes"
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

    // Create Api1
    apiPage.CreateAndFillApi("https://jsonplaceholder.typicode.com/posts");
    // Create Api2
    apiPage.CreateAndFillApi("https://jsonplaceholder.typicode.com/posts");
  });
  it("1. Shows hints without curly braces when user types in data fields", () => {
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.TypeTextIntoField("Label", "JS");
    // Assert that no hint shows up when length of text is less than 3
    agHelper.AssertElementAbsence(locators._hints);
    propPane.TypeTextIntoField("Label", "JSo");
    // Assert that hints show up when length of text is equal to or greater than 3
    agHelper.AssertElementExist(locators._hints);
    propPane.TypeTextIntoField("Label", "unknownVar");
    // Assert that no hint shows up text doesn't match any entity name within the app
    agHelper.AssertElementAbsence(locators._hints);
    propPane.TypeTextIntoField("Label", "API");
    // Assert that hints show up without considering capitalization
    agHelper.AssertElementExist(locators._hints);
    propPane.TypeTextIntoField("Label", "{");
    // Assert that hints show up when 1 curly brace is entered
    agHelper.AssertElementExist(locators._hints);
  });
  it("2. Selects correct value when hint is selected", () => {
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.TypeTextIntoField("Label", "JSo");
    agHelper.GetNClickByContains(locators._hints, "JSObject1.myFun1");
    // After selecting "JSObject1.myFun1", expect "{{JSObject1.myFun1.data}}" in binding
    propPane.ValidatePropertyFieldValue("Label", "{{JSObject1.myFun1.data}}");
    propPane.TypeTextIntoField("Label", "Api");
    agHelper.GetNClickByContains(locators._hints, "Api1");
    // After selecting "Api1", expect "{{Api1.data}}" in binding
    propPane.ValidatePropertyFieldValue("Label", "{{Api1.data}}");
  });
  it("3. Works correctly when user toggles JS", () => {
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.ToggleJSMode("onClick");
    propPane.ValidatePropertyFieldValue("onClick", "{{}}");
    propPane.TypeTextIntoField("onClick", "hello", false);
    // This asserts that cursor was originally between the curly braces after the user switched to js mode
    propPane.ValidatePropertyFieldValue("onClick", "{{hello}}");
  });
});
