import {
  agHelper,
  apiPage,
  draggableWidgets,
  entityExplorer,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Disable JS toggle when Action selector code is not parsable",
  { tags: ["@tag.JS", "@tag.Binding"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 200, 200);
      apiPage.CreateApi("Api1", "GET");
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    });

    it("1. Bug 22180", () => {
      const codeSnippet = `{{["UI Building", "Actions", "JS", "Autocomplete", "Widgets", "Pages", "Property Pane", "API Pane", "Query Editor", "Datasources", "ACL", "Login / Signup", "Telemetry", "Deployment"].forEach((label, index) => {
      Api1.run((res, param) => {
        let CritLen = 0;
        let HighLen = 0;
        let LowLen = 0;
        let NoPriLen = 0;
        res.map(issue => {
          let noPriVal = 1;
          issue.labels.map(label => {
            if (label.name === "Critical") {
              CritLen++;
              noPriVal = 0;
            } else if (label.name === "High") {
              HighLen++;
              noPriVal = 0;
            } else if (label.name === "Low") {
              LowLen++;
              noPriVal = 0;
            }
          });
          NoPriLen += noPriVal;
        });
        storeValue("Bug-" + param.index + "", {
          x: param.label,
          critY: CritLen,
          highY: HighLen,
          lowY: LowLen,
          noPriY: NoPriLen
        });
      }, undefined, {
        label: label,
        index: index
      });
      Query1.run((res, param) => {
        let CritLen = 0;
        let HighLen = 0;
        let LowLen = 0;
        let NoPriLen = 0;
        res.map(issue => {
          let noPriVal = 1;
          issue.labels.map(label => {
            if (label.name === "Critical") {
              CritLen++;
              noPriVal = 0;
            } else if (label.name === "High") {
              HighLen++;
              noPriVal = 0;
            } else if (label.name === "Low") {
              LowLen++;
              noPriVal = 0;
            }
          });
          NoPriLen += noPriVal;
        });
        storeValue("Feature-" + param.index, {
          x: param.label,
          critY: CritLen,
          highY: HighLen,
          lowY: LowLen,
          noPriY: NoPriLen
        });
      }, undefined, {
        label: label,
        index: index
      });
    });}}`;

      propPane.EnterJSContext("onClick", codeSnippet);
      propPane.AssertJSToggleState("onClick", "disabled");
    });

    it("2. should disable JS toggle when the code can't be parsed into UI", () => {
      // Bug 22505
      let codeSnippet = `{{
      showAlert('hi')
      setInterval(() => {console.log('this is an interval')} , 7000, 'id')
      showAlert('hello')
        .then(() => {return Api1.data})
      .then(() => clearInterval('id'))
    }}`;
      propPane.EnterJSContext("onClick", codeSnippet);
      propPane.AssertJSToggleState("onClick", "disabled");

      //Bug 22180
      codeSnippet =
        "{{ (function(){ return Promise.race([ Api1.run({ name: 1 }), Api1.run({ name: 2 }) ]).then((res) => { showAlert(Winner: ${res.args.name}) }); })() }}";
      propPane.EnterJSContext("onClick", codeSnippet);
      propPane.AssertJSToggleState("onClick", "disabled");

      // When Api1 is returned
      codeSnippet = `{{Api1.run().then(() => {
      Api1;
    })}}`;
      propPane.EnterJSContext("onClick", codeSnippet);
      propPane.AssertJSToggleState("onClick", "disabled");

      // When Api1.data is returned
      codeSnippet = `{{Api1.run().then(() => {
      return Api1.data;
    })}}`;
      propPane.EnterJSContext("onClick", codeSnippet);
      propPane.AssertJSToggleState("onClick", "disabled");
    });
  },
);
