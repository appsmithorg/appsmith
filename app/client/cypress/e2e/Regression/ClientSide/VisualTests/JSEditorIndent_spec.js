import {
  agHelper,
  debuggerHelper,
  homePage,
  jsEditor,
  apiPage,
  dataSources,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

describe(
  "JSEditor Indendation - Visual tests",
  { tags: ["@tag.Visual"] },
  () => {
    it("6. TC 1933 - jSEditor prettify verification on cloned application", () => {
      const appName = localStorage.getItem("appName");
      const workspaceName = localStorage.getItem("workspaceName");

      jsEditor.CreateJSObject(
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

      agHelper.ActionContextMenuWithInPane({ action: "Prettify code" });
      agHelper.Sleep(2000); //allowing time to prettify!

      // taking a snap after clicking inside the editor to make sure prettify has not reverted
      agHelper.Sleep(110);
      agHelper.GetNClick(jsEditor._lineinJsEditor(26));

      homePage.NavigateToHome();
      homePage.FilterApplication(workspaceName);
      homePage.ForkApplication(appName);
      EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);
    });

    it("7. TC 1933 - JSEditor prettify verification on cloned page", () => {
      jsEditor.CreateJSObject(
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

      agHelper.ActionContextMenuWithInPane({ action: "Prettify code" });
      agHelper.Sleep(); //allowing time to prettify!

      // taking a snap after clicking inside the editor to make sure prettify has not reverted
      agHelper.Sleep(110);
      agHelper.GetNClick(jsEditor._lineinJsEditor(26));

      PageList.ClonePage("Page1");
      EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);
      agHelper.Sleep(3000);
    });

    it("1. TC 1864 : JSEditor validation for Prettify code with lint errors, triggered by menu option", () => {
      jsEditor.CreateJSObject(
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

      agHelper.ActionContextMenuWithInPane({ action: "Prettify code" });
      agHelper.Sleep(2000); //allowing time to prettify!
      cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify1");

      // taking a snap after clicking inside the editor to make sure prettify has not reverted
      agHelper.GetNClick("div.CodeMirror");
      cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify1");
    });

    it("2. TC 1916, 1917 : JSEditor validation for Prettify code with no errors, triggered by menu option", () => {
      jsEditor.CreateJSObject(
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

      agHelper.ActionContextMenuWithInPane({ action: "Prettify code" });
      agHelper.Sleep(2000); //allowing time to prettify!

      // taking a snap after clicking inside the editor to make sure prettify has not reverted
      agHelper.Sleep(110);
      agHelper.GetNClick(jsEditor._lineinJsEditor(26));

      // click run button and take a snap to make sure prettify did not revert
      _.jsEditor.toolbar.clickRunButton();
      agHelper.Sleep(); // allow time to run
      //Close bottom bar after execution.
      debuggerHelper.CloseBottomBar();

      // click dropdown to change function and make sure prettify has not reverted
      jsEditor.SelectFunctionDropdown("myFun2");
      agHelper.AssertContains("ran successfully", "not.exist");
    });

    it("3. TC 1863 : JSEditor validation for Prettify code with lint errors, triggered by keyboard shortcut", () => {
      jsEditor.CreateJSObject(
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
      agHelper.GetNClick("div.CodeMirror");
      cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify3");
    });

    it("4. TC 1863 : JSEditor validation for Prettify code with no errors, triggered by keyboard shortcut", () => {
      jsEditor.CreateJSObject(
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
      agHelper.Sleep(110);
      agHelper.GetNClick(jsEditor._lineinJsEditor(26));

      // click run button and take a snap to make sure prettify did not revert
      _.jsEditor.toolbar.clickRunButton();
      agHelper.Sleep(); // allow time to run
      //Close bottom bar after execution.
      debuggerHelper.CloseBottomBar();

      // click dropdown to change function and make sure prettify has not reverted
      jsEditor.SelectFunctionDropdown("myFun2");
      agHelper.AssertContains("ran successfully", "not.exist");
    });

    it("5. TC 1862 - JSEditor validation for goLineStartSmart with no errors, triggered by keyboard shortcut", () => {
      jsEditor.CreateJSObject(`const a = 1826;`, {
        paste: false,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      });

      cy.get("div.CodeMirror").matchImageSnapshot(
        "jsObjBeforeGoLineStartSmart5",
      );

      cy.get("div.CodeMirror").type("{cmd+leftArrow}");
      cy.get("div.CodeMirror").matchImageSnapshot(
        "jsObjAfterGoLineStartSmart5",
      );

      cy.get("div.CodeMirror").type("{cmd+leftArrow}");
      cy.get("div.CodeMirror").matchImageSnapshot(
        "jsObjAfterGoLineStartSmart5",
      );
    });

    it("5. Bug 25325 Check if the JS Object in body field is formatted properly on save", () => {
      apiPage.CreateApi("FirstAPI");
      apiPage.SelectPaneTab("Body");
      apiPage.SelectSubTab("JSON");
      dataSources.EnterQuery(
        `{{
        {
          "title": this.params.title,
              "due": this.params.due,
                  assignee: this.params.assignee
                  }
      }}`,
      );
      cy.get("body").type(agHelper.isMac ? "{meta}S" : "{ctrl}S");
      cy.get(apiPage.jsonBody).matchImageSnapshot("formattedJSONBodyAfterSave");
    });
  },
);
