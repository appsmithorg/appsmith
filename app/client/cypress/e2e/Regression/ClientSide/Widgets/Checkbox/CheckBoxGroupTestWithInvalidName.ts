import {
  entityExplorer,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

//The widget should throw an error when the widget is renamed with a name that starts with a digit or a number
describe(
  "Checkbox widget name validation tests",
  { tags: ["@tag.Widget", "@tag.Checkbox"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify("checkboxgroupwidget", 550, 100);
    });
    it("CheckboxGroup renamed with the name which start with a digit", () => {
      EditorNavigation.SelectEntityByName("CheckboxGroup1", EntityType.Widget);
      const title = cy.get(propPane._paneTitle);
      title.should("exist");
      title.dblclick();
      title.type("1CheckboxGroup{enter}");
      title.should("have.text", "1CheckboxGroup");
      const warn = cy.get(".Toastify__toast-body");
      warn.should("exist");
    });
    it("CheckboxGroup renamed with valid name", () => {
      EditorNavigation.SelectEntityByName("CheckboxGroup1", EntityType.Widget);
      const newTitle = cy.get(propPane._paneTitle);
      newTitle.should("exist");
      newTitle.dblclick();
      newTitle.type("CheckboxGroup{enter}");
      newTitle.should("have.text", "CheckboxGroup");
      EditorNavigation.SelectEntityByName("CheckboxGroup", EntityType.Widget);
      const newTitle1 = cy.get(propPane._paneTitle);
      newTitle1.should("exist");
      newTitle1.should("have.text", "CheckboxGroup");
    });
  },
);
