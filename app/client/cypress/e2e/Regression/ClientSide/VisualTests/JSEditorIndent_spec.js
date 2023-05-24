import * as _ from "../../../../support/Objects/ObjectsCore";

describe("JSEditor Indendation - Visual tests", () => {
  it("6. TC 1933 - jSEditor prettify verification on cloned application", () => {
    const appname = localStorage.getItem("AppName");
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
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjBeforePrettify6");

    _.agHelper.ActionContextMenuWithInPane("Prettify code");
    _.agHelper.Sleep(2000); //allowing time to prettify!
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify6");

    // taking a snap after clicking inside the editor to make sure prettify has not reverted
    _.agHelper.GetNClick(_.jsEditor._lineinJsEditor(26));
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify6");

    _.homePage.NavigateToHome();
    _.homePage.ForkApplication(appname);
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.entityExplorer.SelectEntityByName("JSObject1", "Queries/JS");
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify6");
  });

  it("7. TC 1933 - JSEditor prettify verification on cloned page", () => {
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

    cy.get("div.CodeMirror").matchImageSnapshot("jsObjBeforePrettify7");

    _.agHelper.ActionContextMenuWithInPane("Prettify code");
    _.agHelper.Sleep(); //allowing time to prettify!
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify7");

    // taking a snap after clicking inside the editor to make sure prettify has not reverted
    _.agHelper.GetNClick(_.jsEditor._lineinJsEditor(26));
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify7");

    _.entityExplorer.ClonePage("Page1");
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.entityExplorer.SelectEntityByName("JSObject1", "Queries/JS");
    _.agHelper.Sleep(3000);
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify7");
  });

  it("1. TC 1864 : JSEditor validation for Prettify code with lint errors, triggered by menu option", () => {
    _.jsEditor.CreateJSObject(
      `export default {
myVar1: [], myVar2: {},myFun1: () => {
let allFuncs = [
Genderize.run({ country: 'India' }),
RandomUser.run(),
GetAnime.run({ name: 'Gintama' }),
InspiringQuotes.run(),
Agify.run({ person: 'Scripty' }),
Christmas.run()
]
showAlert("Running all api's", "warning");
return Promise.all(allFuncs).then(() => showAlert("Wonderful! all apis executed", "success")).catch(() => showAlert("Please check your api's again", "error")); },myFun2: async () => {
//use async-await or promises}
}`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        prettify: false,
      },
    );

    cy.get("div.CodeMirror").matchImageSnapshot("jsObjBeforePrettify1");

    _.agHelper.ActionContextMenuWithInPane("Prettify code");
    _.agHelper.Sleep(2000); //allowing time to prettify!
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify1");

    // taking a snap after clicking inside the editor to make sure prettify has not reverted
    _.agHelper.GetNClick("div.CodeMirror");
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify1");
  });

  it("2. TC 1916, 1917 : JSEditor validation for Prettify code with no errors, triggered by menu option", () => {
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

    cy.get("div.CodeMirror").matchImageSnapshot("jsObjBeforePrettify2");

    _.agHelper.ActionContextMenuWithInPane("Prettify code");
    _.agHelper.Sleep(2000); //allowing time to prettify!
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify2");

    // taking a snap after clicking inside the editor to make sure prettify has not reverted
    _.agHelper.GetNClick(_.jsEditor._lineinJsEditor(26));
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify2");

    // click run button and take a snap to make sure prettify did not revert
    _.agHelper.GetNClick(_.jsEditor._runButton);
    _.agHelper.Sleep(); // allow time to run
    //Close bottom bar after execution.
    _.debuggerHelper.CloseBottomBar();
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify2");

    // click dropdown to change function and make sure prettify has not reverted
    _.jsEditor.SelectFunctionDropdown("myFun2");
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify2");
    _.agHelper.AssertContains("ran successfully", "not.exist");
  });

  it("3. TC 1863 : JSEditor validation for Prettify code with lint errors, triggered by keyboard shortcut", () => {
    _.jsEditor.CreateJSObject(
      `export default {
myVar1: [],
myVar2: {},
myFun1: () => {
let allFuncs = [
Genderize.run({ country: 'India' }),
RandomUser.run(),
GetAnime.run({ name: 'Gintama' }),
InspiringQuotes.run(),
Agify.run({ person: 'Scripty' }),
Christmas.run()
]
showAlert("Running all api's", "warning");
return Promise.all(allFuncs).then(() => showAlert("Wonderful! all apis executed", "success")).catch(() => showAlert("Please check your api's again", "error")); },
myFun2: async () => {
//use async-await or promises}
}`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        prettify: false,
      },
    );
    cy.get("div.CodeMirror")
      .wait(1000)
      .matchImageSnapshot("jsObjBeforePrettify3");

    cy.get("div.CodeMirror").type("{shift+cmd+p}");
    cy.get("div.CodeMirror")
      .wait(1000)
      .matchImageSnapshot("jsObjAfterPrettify3");

    // taking a snap after clicking inside the editor to make sure prettify has not reverted
    _.agHelper.GetNClick("div.CodeMirror");
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify3");
  });

  it("4. TC 1863 : JSEditor validation for Prettify code with no errors, triggered by keyboard shortcut", () => {
    _.jsEditor.CreateJSObject(
      `export default {
myVar1: [],
myVar2: {},
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

    cy.get("div.CodeMirror").matchImageSnapshot("jsObjBeforePrettify4");

    cy.get("div.CodeMirror").type("{shift+cmd+p}").wait(1000);
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify4");

    // taking a snap after clicking inside the editor to make sure prettify has not reverted
    _.agHelper.GetNClick(_.jsEditor._lineinJsEditor(26));
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify4_1");

    // click run button and take a snap to make sure prettify did not revert
    _.agHelper.GetNClick(_.jsEditor._runButton);
    _.agHelper.Sleep(); // allow time to run
    //Close bottom bar after execution.
    _.debuggerHelper.CloseBottomBar();
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify4_1");

    // click dropdown to change function and make sure prettify has not reverted
    _.jsEditor.SelectFunctionDropdown("myFun2");
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify4_1");
    _.agHelper.AssertContains("ran successfully", "not.exist");
  });

  it("5. TC 1862 - JSEditor validation for goLineStartSmart with no errors, triggered by keyboard shortcut", () => {
    _.jsEditor.CreateJSObject(`const a = 1826;`, {
      paste: false,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    cy.get("div.CodeMirror").matchImageSnapshot("jsObjBeforeGoLineStartSmart5");

    cy.get("div.CodeMirror").type("{cmd+leftArrow}");
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterGoLineStartSmart5");

    cy.get("div.CodeMirror").type("{cmd+leftArrow}");
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterGoLineStartSmart5");
  });
});
