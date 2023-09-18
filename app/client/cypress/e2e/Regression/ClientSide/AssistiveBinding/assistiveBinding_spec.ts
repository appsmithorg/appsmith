import {
  agHelper,
  locators,
  entityExplorer,
  jsEditor,
  propPane,
  apiPage,
  dataManager,
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
    apiPage.CreateAndFillApi(
      dataManager.dsValues[dataManager.defaultEnviorment].echoApiUrl,
    );
    // Create Api2
    apiPage.CreateAndFillApi(
      dataManager.dsValues[dataManager.defaultEnviorment].echoApiUrl,
    );
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
  it("3. Shows hints after every white space", () => {
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.TypeTextIntoField("Label", "JSo JSo");
    // Assert that hints show up when length of text after any previous blank space is equal to or greater than 3
    agHelper.AssertElementExist(locators._hints);
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.TypeTextIntoField("Label", "JSo tab\tJSo");
    // Assert that hints show up when length of text after any previous tab is equal to or greater than 3
    agHelper.AssertElementExist(locators._hints);
    propPane.TypeTextIntoField("Label", "JSo \nJSo");
    // Assert that hints show up when length of text after any previous new line is equal to or greater than 3
    agHelper.AssertElementExist(locators._hints);
  });

  it("4. Selects correct value and inserts in right place when hint is selected after whitespace ", () => {
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.TypeTextIntoField("Label", "JSo JSo");
    agHelper.GetNClickByContains(locators._hints, "JSObject1.myFun1");
    // After selecting "JSObject1.myFun1", expect "JSo {{JSObject1.myFun1.data}}" in binding
    propPane.ValidatePropertyFieldValue(
      "Label",
      "JSo {{JSObject1.myFun1.data}}",
    );
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.TypeTextIntoField("Label", "JSo tab\tJSo");
    agHelper.GetNClickByContains(locators._hints, "JSObject1.myFun1");
    // After selecting "JSObject1.myFun1", expect "JSo tab {{JSObject1.myFun1.data}}" in binding
    propPane.ValidatePropertyFieldValue(
      "Label",
      "JSo tab {{JSObject1.myFun1.data}}",
    );
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.TypeTextIntoField("Label", `JSo \nJSo`);
    agHelper.GetNClickByContains(locators._hints, "JSObject1.myFun1");
    // After selecting "JSObject1.myFun1", expect `JSo \n{{JSObject1.myFun1.data}}` in binding
    propPane.ValidatePropertyFieldValue(
      "Label",
      `JSo {{JSObject1.myFun1.data}}`,
    );
  });

  it("5. Partial binding {} syntax is replaced with correct values ", () => {
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.TypeTextIntoField("Label", "{");
    agHelper.GetNClickByContains(locators._hints, "JSObject1.myFun1");
    // After selecting "JSObject1.myFun1", expect "{{JSObject1.myFun1.data}}" in binding
    propPane.ValidatePropertyFieldValue("Label", "{{JSObject1.myFun1.data}}");
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.TypeTextIntoField("Label", "{");
    agHelper.GetNClickByContains(locators._hints, "Add a binding");
    // After selecting "Add a binding", expect "{{}}" in binding
    propPane.ValidatePropertyFieldValue("Label", "{{}}");
  });

  it("6. Works correctly when user toggles JS", () => {
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.ToggleJSMode("onClick");
    propPane.ValidatePropertyFieldValue("onClick", "{{}}");
    propPane.TypeTextIntoField("onClick", "hello", false);
    // This asserts that cursor was originally between the curly braces after the user switched to js mode
    propPane.ValidatePropertyFieldValue("onClick", "{{hello}}");
  });
});
