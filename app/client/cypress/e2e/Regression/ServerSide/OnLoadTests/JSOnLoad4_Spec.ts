import {
  entityExplorer,
  entityItems,
  jsEditor,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

let jsName: any;

describe(
  "JSObjects OnLoad Actions tests",
  { tags: ["@tag.PropertyPane", "@tag.JS", "@tag.Binding"] },
  function () {
    it("1. Tc 51, 52 Verify that JS editor function has a settings button available for functions", () => {
      jsEditor.CreateJSObject(
        `export default {
        myVar1: [],
        myVar2: {},
        myFun1: () => {	},
        myFun2: async () => {	},
        myFun3: async () => {	},
        myFun4: async () => {	},
        myFun5: async () => {	},
        myFun6: async () => {	},
        myFun7: () => {	},
      }`,
        {
          paste: true,
          completeReplace: true,
          toRun: false,
          shouldCreateNewJSObj: true,
        },
      );

      jsEditor.VerifyAsyncFuncSettings("myFun1", false);
      jsEditor.VerifyAsyncFuncSettings("myFun2", false);
      jsEditor.VerifyAsyncFuncSettings("myFun3", false);
      jsEditor.VerifyAsyncFuncSettings("myFun4", false);
      jsEditor.VerifyAsyncFuncSettings("myFun5", false);
      jsEditor.VerifyAsyncFuncSettings("myFun6", false);

      VerifyFunctionDropdown([
        "myFun1",
        "myFun7",
        "myFun2",
        "myFun3",
        "myFun4",
        "myFun5",
        "myFun6",
      ]);

      cy.get("@jsObjName").then((jsObjName) => {
        jsName = jsObjName;
        EditorNavigation.SelectEntityByName(
          jsName as string,
          EntityType.JSObject,
        );
        entityExplorer.ActionContextMenuByEntityName({
          entityNameinLeftSidebar: jsName as string,
          action: "Delete",
          entityType: entityItems.JSObject,
        });
      });
    });

    function VerifyFunctionDropdown(functions: string[]) {
      cy.get(jsEditor._funcDropdown).click();
      cy.get(jsEditor._funcDropdownOptions).then(function ($ele) {
        expect($ele.eq(0).text()).to.be.oneOf(functions);
        expect($ele.eq(1).text()).to.be.oneOf(functions);
        expect($ele.eq(2).text()).to.be.oneOf(functions);
        expect($ele.eq(3).text()).to.be.oneOf(functions);
        expect($ele.eq(4).text()).to.be.oneOf(functions);
        expect($ele.eq(5).text()).to.be.oneOf(functions);
        expect($ele.eq(6).text()).to.be.oneOf(functions);
      });
      cy.get(jsEditor._funcDropdown).click();
    }
  },
);
