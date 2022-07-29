import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import homePage from "../../../../locators/HomePage";

let jsEditor = ObjectsRegistry.JSEditor,
  agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer;
const pages = require("../../../../locators/Pages.json");

describe("JSEditor Indendation - Visual tests", () => {
  // for any changes in UI, update the screenshot in snapshot folder, to do so:
  //  1. Delete the required screenshot which you want to update.
  //  2. Run test in headless mode with any browser except chrome.(to maintain same resolution in CI)
  //  3. New screenshot will be generated in the snapshot folder.

  it("6. TC 1933 - jSEditor prettify verification on cloned application", () => {
    const appname = localStorage.getItem("AppName");
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
      },
    );

    cy.get("[name='expand-more']")
      .eq(1)
      .click({ force: true });

    cy.get("div.CodeMirror").matchImageSnapshot("jsObjBeforePrettify6");
    cy.get(".t--more-action-menu")
      .first()
      .click();
    cy.contains("Prettify Code")
      .trigger("click")
      .wait(3000); //allowing time to prettify!

    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify6");

    // taking a snap after clicking inside the editor to make sure prettify has not reverted
    cy.get("div.CodeMirror").click();
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify6");
    cy.wait(2000);
    cy.NavigateToHome();
    cy.wait(2000);
    cy.get(homePage.searchInput).type(appname);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appMoreIcon)
      .first()
      .click({ force: true });
    cy.get(homePage.duplicateApp).click({ force: true });

    cy.CheckAndUnfoldEntityItem("QUERIES/JS");
    cy.SearchEntityandOpen("JSObject1");
    cy.wait(3000);

    cy.get("[name='expand-more']")
      .eq(1)
      .click({ force: true });

    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify6");
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
      },
    );

    cy.get("[name='expand-more']")
      .eq(1)
      .click({ force: true });

    cy.get("div.CodeMirror").matchImageSnapshot("jsObjBeforePrettify7");
    cy.get(".t--more-action-menu")
      .first()
      .click();
    cy.contains("Prettify Code")
      .trigger("click")
      .wait(3000); //allowing time to prettify!

    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify7");

    // taking a snap after clicking inside the editor to make sure prettify has not reverted
    cy.get("div.CodeMirror").click();
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify7");

    ee.ClonePage("Page1");
    ee.SelectEntityByName("JSObject1", "QUERIES/JS");
    cy.wait(3000);

    cy.get("[name='expand-more']")
      .eq(1)
      .click({ force: true });

    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify7");
  });

  it("1. TC 1864 : JSEditor validation for Prettify Code with lint errors, triggered by menu option", () => {
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
      },
    );

    cy.get("[name='expand-more']")
      .eq(1)
      .click({ force: true });

    cy.get("div.CodeMirror").matchImageSnapshot("jsObjBeforePrettify1");
    cy.get(".t--more-action-menu")
      .first()
      .click();
    cy.contains("Prettify Code")
      .trigger("click")
      .wait(3000); //allowing time to prettify!

    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify1");

    // taking a snap after clicking inside the editor to make sure prettify has not reverted
    cy.get("div.CodeMirror").click();
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify1");
  });

  it("2. TC 1916, 1917 : JSEditor validation for Prettify Code with no errors, triggered by menu option", () => {
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
      },
    );

    cy.get("[name='expand-more']")
      .eq(1)
      .click({ force: true });

    cy.get("div.CodeMirror").matchImageSnapshot("jsObjBeforePrettify2");
    cy.get(".t--more-action-menu")
      .first()
      .click();
    cy.contains("Prettify Code")
      .trigger("click")
      .wait(3000); //allowing time to prettify!

    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify2");

    // taking a snap after clicking inside the editor to make sure prettify has not reverted
    cy.get("div.CodeMirror").click();
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify2");

    // click run button and take a snap to make sure prettify did not revert
    cy.contains("Run")
      .click({ force: true })
      .wait(3000); // allow time to run
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify2");

    // click dropdown to change function and make sure prettify has not reverted

    cy.get("[name='expand-more']")
      .eq(0)
      .click({ force: true });
    cy.contains("myFun2").trigger("click");
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify2");
    agHelper.WaitUntilToastDisappear("ran successfully");
  });

  it("3. TC 1863 : JSEditor validation for Prettify Code with lint errors, triggered by keyboard shortcut", () => {
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
      },
    );

    cy.get("[name='expand-more']")
      .eq(1)
      .click({ force: true });

    cy.get("div.CodeMirror")
      .wait(1000)
      .matchImageSnapshot("jsObjBeforePrettify3");
    cy.get("div.CodeMirror").type("{shift+cmd+p}");

    cy.get("div.CodeMirror")
      .wait(1000)
      .matchImageSnapshot("jsObjAfterPrettify3");

    // taking a snap after clicking inside the editor to make sure prettify has not reverted
    cy.get("div.CodeMirror")
      .click()
      .wait(1000);
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify3");
  });

  it("4. TC 1863 : JSEditor validation for Prettify Code with no errors, triggered by keyboard shortcut", () => {
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
      },
    );

    cy.get("[name='expand-more']")
      .eq(1)
      .click({ force: true });

    cy.get("div.CodeMirror").matchImageSnapshot("jsObjBeforePrettify4");
    cy.get("div.CodeMirror")
      .type("{shift+cmd+p}")
      .wait(1000);

    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify4");

    // taking a snap after clicking inside the editor to make sure prettify has not reverted
    cy.get("div.CodeMirror")
      .click()
      .wait(1000);
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify4_1");

    // click run button and take a snap to make sure prettify did not revert
    cy.contains("Run")
      .click({ force: true })
      .wait(3000); // allow time to run
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify4_1");

    // click dropdown to change function and make sure prettify has not reverted
    // click dropdown to change function and make sure prettify has not reverted
    cy.get("[name='expand-more']")
      .eq(0)
      .click({ force: true });
    cy.contains("myFun2")
      .trigger("click")
      .wait(1000);
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify4_1");
    agHelper.WaitUntilToastDisappear("ran successfully");
  });

  it("5. TC 1862 - JSEditor validation for goLineStartSmart with no errors, triggered by keyboard shortcut", () => {
    jsEditor.CreateJSObject(`const a = 1826;`, {
      paste: false,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    cy.get("[name='expand-more']")
      .eq(1)
      .click({ force: true });

    cy.get("div.CodeMirror").matchImageSnapshot("jsObjBeforeGoLineStartSmart5");

    cy.get("div.CodeMirror").type("{cmd+leftArrow}");
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterGoLineStartSmart5");

    cy.get("div.CodeMirror").type("{cmd+leftArrow}");
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterGoLineStartSmart5");
  });
});
