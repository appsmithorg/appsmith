import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

let agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  jsEditor = ObjectsRegistry.JSEditor,
  locator = ObjectsRegistry.CommonLocators,
  deployMode = ObjectsRegistry.DeployMode,
  propPane = ObjectsRegistry.PropertyPane;

describe(
  "Validate JSObjects binding to Input widget",
  { tags: ["@tag.Binding"] },
  () => {
    before(() => {
      agHelper.AddDsl("formInputTableDsl");
    });

    let jsOjbNameReceived: any;

    it("1. Bind Input widget with JSObject", function () {
      jsEditor.CreateJSObject(
        `export default {
      myVar1: [],
      myVar2: {},
      myFun1: () => {
        return "Success";//write code here
      },
      myFun2: async () => {
        //use async-await or promises
      }
    }`,
        {
          paste: true,
          completeReplace: true,
          toRun: true,
          shouldCreateNewJSObj: true,
        },
      );
      EditorNavigation.SelectEntityByName("Input2", EntityType.Widget, {}, [
        "Form1",
      ]);
      cy.get(locator._inputWidget)
        .last()
        .invoke("attr", "value")
        .should("equal", "Hello"); //Before mapping JSObject value of input
      cy.get("@jsObjName").then((jsObjName) => {
        jsOjbNameReceived = jsObjName;
        propPane.UpdatePropertyFieldValue(
          "Default value",
          "{{" + jsObjName + ".myFun1()}}",
        );
      });
      cy.get(locator._inputWidget)
        .last()
        .invoke("attr", "value")
        .should("equal", "Success"); //After mapping JSObject value of input
      deployMode.DeployApp(locator._widgetInputSelector("inputwidgetv2"));
      cy.get(locator._widgetInputSelector("inputwidgetv2"))
        .first()
        .should("have.value", "Hello");
      cy.get(locator._widgetInputSelector("inputwidgetv2"))
        .last()
        .should("have.value", "Success");
      deployMode.NavigateBacktoEditor();

      // cy.get(locator._inputWidget)
      //   .last()
      //   .within(() => {
      //     cy.get("input")
      //       .invoke("attr", "value")
      //       .should("equal", 'Success');
      //   });
    });

    it("2. Bug 11529 - Verify autosave while editing JSObj & reference changes when JSObj is mapped", function () {
      const jsBody = `export default {
      myVar1: [],
      myVar2: {},
      renamed: () => {
        return "Success";//write code here
      },
      myFun2: async () => {
        //use async-await or promises
      }
    }`;
      EditorNavigation.SelectEntityByName(
        jsOjbNameReceived as string,
        EntityType.JSObject,
      );
      jsEditor.EditJSObj(jsBody);
      EditorNavigation.SelectEntityByName("Input2", EntityType.Widget, {}, [
        "Form1",
      ]);
      cy.get(locator._inputWidget)
        .last()
        .invoke("attr", "value")
        .should("equal", "Success"); //Function is renamed & reference is checked if updated properly!
      deployMode.DeployApp(locator._widgetInputSelector("inputwidgetv2"));
      cy.get(locator._widgetInputSelector("inputwidgetv2"))
        .first()
        .should("have.value", "Hello");
      cy.get(locator._widgetInputSelector("inputwidgetv2"))
        .last()
        .should("have.value", "Success");
    });
  },
);
