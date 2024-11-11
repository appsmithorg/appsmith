import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../../locators/commonlocators.json");
const dslWithSchema = require("../../../../../fixtures/jsonFormDslWithSchema.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
const locators = ObjectsRegistry.CommonLocators;
const {
  agHelper,
  deployMode,
  entityExplorer,
  propPane,
} = require("../../../../../support/Objects/ObjectsCore");
import { datePickerlocators } from "../../../../../locators/WidgetLocators";
const fieldPrefix = ".t--jsonformfield";

describe(
  "JSON Form Widget Field Change",
  { tags: ["@tag.Widget", "@tag.JSONForm", "@tag.Binding"] },
  () => {
    before(() => {
      cy.addDsl(dslWithSchema);
    });

    it("1. modifies field type text to number", () => {
      cy.openPropertyPane("jsonformwidget");
      cy.get(locators._jsToggle("sourcedata")).click({ force: true });
      cy.get(`${fieldPrefix}-name`).find("button").should("not.exist");
      cy.openFieldConfiguration("name");
      cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Number Input");
      propPane.NavigateBackToPropertyPane();
      propPane.SelectPlatformFunction("onSubmit", "Show alert");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Message"),
        "{{JSONForm1.formData.name.toString()}}",
      );
      deployMode.DeployApp();
      agHelper.TypeText(datePickerlocators.input, "123");
      agHelper.Sleep(500);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("123");
      agHelper.TypeText(datePickerlocators.input, "konnichiwa");
      agHelper.ClickButton("Submit");
      agHelper.FailIfErrorToast(
        "Cannot read properties of null (reading 'toString')",
      );
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.get(`${fieldPrefix}-name`).find("button").should("have.length", 2);
      cy.openPropertyPane("jsonformwidget");
      cy.openFieldConfiguration("name");
      cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Text Input/);
    });

    it("2. modifies field type text to checkbox", () => {
      cy.get(`${fieldPrefix}-name`)
        .find("input")
        .invoke("attr", "type")
        .should("contain", "text");
      cy.openFieldConfiguration("name");
      cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Checkbox");
      deployMode.DeployApp();
      cy.get(`${fieldPrefix}-name`)
        .find("input")
        .invoke("attr", "type")
        .should("contain", "checkbox");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("name");
      cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Text Input/);
    });

    it("3. modifies field type text to date", () => {
      cy.get(`${fieldPrefix}-name`).find("input").click({ force: true });
      cy.get(".bp3-popover.bp3-dateinput-popover").should("not.exist");
      cy.openFieldConfiguration("name");
      cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Datepicker");
      deployMode.DeployApp();
      cy.get(`${fieldPrefix}-name`).find("input").click({ force: true });
      cy.get(".bp3-popover.bp3-dateinput-popover").should("exist");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("name");
      cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Text Input/);
    });

    it("4. modifies field type text to switch", () => {
      cy.get(`${fieldPrefix}-name`)
        .find(".bp3-control.bp3-switch")
        .should("not.exist");

      cy.openFieldConfiguration("name");
      cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Switch");

      deployMode.DeployApp();
      cy.get(`${fieldPrefix}-name`)
        .find(".bp3-control.bp3-switch")
        .should("exist");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("name");
      cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Text Input/);
    });

    it("5. modifies field type text to Multi-Select", () => {
      cy.get(`${fieldPrefix}-name`)
        .find(".rc-select-multiple")
        .should("not.exist");

      cy.openFieldConfiguration("name");
      cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Multiselect");
      deployMode.DeployApp();
      cy.get(`${fieldPrefix}-name`).find(".rc-select-multiple").should("exist");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("name");
      cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Text Input/);
    });

    it("6. modifies field type text to Radio-Group", () => {
      cy.get(`${fieldPrefix}-name`)
        .find(".bp3-control.bp3-radio")
        .should("not.exist");

      cy.openFieldConfiguration("name");
      cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Radio Group");
      deployMode.DeployApp();
      cy.get(`${fieldPrefix}-name`)
        .find(".bp3-control.bp3-radio")
        .should("exist")
        .should("have.length", 2);
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("name");
      cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Text Input/);
    });

    it("7. modifies field type text to Array", () => {
      cy.get(`${fieldPrefix}-name`)
        .find(".t--jsonformfield-array-add-btn")
        .should("not.exist");

      cy.openFieldConfiguration("name");
      cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Array");
      deployMode.DeployApp();
      cy.get('button span:contains("Add New")').first().should("be.visible");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("name");
      cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Text Input/);
    });

    it("8. modifies field type text to Object", () => {
      cy.openFieldConfiguration("name");
      cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Object");
      cy.get(`${fieldPrefix}-name`).find("input").should("not.exist");

      cy.get(commonlocators.jsonFormAddNewCustomFieldBtn).click({
        force: true,
      });

      deployMode.DeployApp();
      cy.get(`${fieldPrefix}-name`).find("input").should("exist");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("name");
      cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Text Input/);
    });

    it("9. modifies field type Multi-Select to Array", () => {
      cy.get(`${fieldPrefix}-hobbies`)
        .find(".rc-select-multiple")
        .should("exist");

      cy.openFieldConfiguration("hobbies");
      cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Array");
      deployMode.DeployApp();
      cy.get(`${fieldPrefix}-hobbies`).then((hobbies) => {
        cy.wrap(hobbies)
          .find(".t--jsonformfield-array-add-btn")
          .should("exist");
        cy.wrap(hobbies).find("input").should("have.length", 2);
        cy.wrap(hobbies)
          .find(".t--jsonformfield-array-delete-btn")
          .should("have.length", 2);
      });
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("name");
      cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Text Input/);
    });

    it("10. modifies field type text to Select", () => {
      cy.get(`${fieldPrefix}-name label`).click({ force: true });
      cy.get(".bp3-select-popover.select-popover-wrapper").should("not.exist");

      cy.openFieldConfiguration("name");
      cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Select/);

      cy.get(`${fieldPrefix}-name label`).click({ force: true });
      cy.get(".bp3-select-popover.select-popover-wrapper").should("exist");
      cy.closePropertyPane();
    });
  },
);
