import { WIDGET, getWidgetSelector } from "../../../../locators/WidgetLocators";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const {
  AggregateHelper: agHelper,
  CommonLocators: locator,
  DeployMode: deployMode,
  EntityExplorer: ee,
  JSEditor: jsEditor,
  PropertyPane: propPane,
} = ObjectsRegistry;

describe("JSObject testing", () => {
  const utils_JSObject_body = `export default {
    valueSelector: () => {
      switch(Select1.selectedOptionValue){
         case "MAP":
          return [...map_.counterObj]
         case "SET":
          return [...set_.counterObj]
          case "NUMBER":
          return number_.counterObj
          case "ARRAY":
           return array_.counterObj
          case "OBJECT":
           return object_.counterObj
         default:
           break;
       }
    },
    incrementSelector: () => {
      switch(Select1.selectedOptionValue){
         case "MAP":
          return map_.increment()
         case "SET":
          return set_.increment()
          case "NUMBER":
          return number_.increment()
          case "ARRAY":
           return array_.increment()
          case "OBJECT":
           return object_.increment()
         default:
           break;
       }
    },
    decrementSelector: () => {
      switch(Select1.selectedOptionValue){
         case "MAP":
          return map_.decrement()
         case "SET":
          return set_.decrement()
          case "NUMBER":
          return number_.decrement()
          case "ARRAY":
           return array_.decrement()
          case "OBJECT":
           return object_.decrement()
         default:
           break;
       }
    }
  }`;

  const array_JSObject_body = `export default {
    counterObj: [],
    increment: async function(){
      this.counterObj.push(this.counterObj.length) 
    },
    decrement: function(){
     this.counterObj.pop()
    },
    print: () => this.counterObj
   }`;

  const map_JSObject_body = `export default {
    counterObj: new Map(),
    increment: async function(){
      // async 
      this.counterObj.set("a", this.counterObj.size)
      return [...this.counterObj]
    },
    decrement: function(){
     this.counterObj.delete("a")
      return [...this.counterObj]
    }
   }`;

  const number_JSObject_body = `export default {
    counterObj: 1,
    increment: function(){
      this.counterObj = this.counterObj + 1
      return this.counterObj
    },
    decrement: function(){
      this.counterObj = this.counterObj - 1;
      return this.counterObj
    }
  }`;

  const set_JSObject_body = `export default {
    counterObj: new Set([]),
    increment: function(){
      console.log([...this.counterObj]);
      this.counterObj.add(this.counterObj.size)
      return [...this.counterObj]
    },
    decrement: function(){
     this.counterObj.delete(this.counterObj.size - 1)
      return [...this.counterObj]
    }
   }`;

  const object_JSObject_body = `export default {
    counterObj: {
      a: {}
    },
    increment: async function(){
      this.counterObj.a.b = 1
      return this.counterObj
    },
    decrement: async function(){
     delete this.counterObj.a
     return this.counterObj
    }
   }`;

  before(() => {
    cy.fixture("JSObjectMutationApp").then((val: any) => {
      agHelper.AddDsl(val);
    });

    jsEditor.CreateJSObject(array_JSObject_body, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    jsEditor.RenameJSObjFromPane("array_");

    jsEditor.CreateJSObject(map_JSObject_body, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    jsEditor.RenameJSObjFromPane("map_");

    jsEditor.CreateJSObject(number_JSObject_body, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    jsEditor.RenameJSObjFromPane("number_");

    jsEditor.CreateJSObject(set_JSObject_body, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    jsEditor.RenameJSObjFromPane("set_");

    jsEditor.CreateJSObject(object_JSObject_body, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    jsEditor.RenameJSObjFromPane("object_");

    jsEditor.CreateJSObject(utils_JSObject_body, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    jsEditor.RenameJSObjFromPane("utils");
  });

  it("1. Number increment and decrement", function () {
    // Show canvas
    ee.NavigateToSwitcher("widgets");

    let label: string;

    agHelper.ClickButton("ADD");
    agHelper.ClickButton("ADD");
    agHelper.ClickButton("ADD");
    label = agHelper.GetText(getWidgetSelector(WIDGET.TEXT), "text", 0);

    // Assert the Text widget has value 4
    expect(label).to.eq("4");

    agHelper.ClickButton("SUB");
    agHelper.ClickButton("SUB");
    label = agHelper.GetText(getWidgetSelector(WIDGET.TEXT), "text", 0);
    // Assert the Text widget has value 2
    expect(label).to.eq("2");

    //
  });
});
