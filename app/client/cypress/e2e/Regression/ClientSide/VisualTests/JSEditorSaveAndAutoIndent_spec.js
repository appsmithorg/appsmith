import * as _ from "../../../../support/Objects/ObjectsCore";

describe(
  "JS Editor Save and Auto-indent: Visual tests",
  { tags: ["@tag.Visual"] },
  () => {
    it("1. Auto indents and saves the code when Ctrl/Cmd+s is pressed", () => {
      _.jsEditor.CreateJSObject(
        `export default {
myFun1: () => {
console.log("hi");
console.log("hidchjvxz sd,bcjmsd");
let sum = 0;
for (let i = 1; i<5; i++) {
sum += i;
}
switch (sum) {
case 1: console.log('hey ho');
let sum1 = 2;
break;
case 2:
console.log('hey ho');
let sum2 = 2;
break;
case 3:
 console.log('hey ho');
 break;
}
function hi(a,b) {
console.log(a,b);
}
hi(1,2);
},
myFun2: async () => {
//use async-await or promises
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
      // _.agHelper.GetNClick("[name='expand-more']", 1, true, 100);
      cy.get("div.CodeMirror").matchImageSnapshot("jsObjBeforeSaveAndPrettify");

      cy.get("div.CodeMirror").type("{cmd+s}").wait(2000);
      _.agHelper.GetNClick(_.jsEditor._lineinJsEditor(5));
      cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterSaveAndPrettify");
      _.agHelper.AssertAutoSave();

      // taking a snap after clicking inside the editor to make sure prettify has not reverted
      _.agHelper.Sleep(110);
      _.agHelper.GetNClick(_.jsEditor._lineinJsEditor(25));
      cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterSaveAndPrettify");
    });
  },
);
