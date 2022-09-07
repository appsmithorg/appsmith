import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper,
  table = ObjectsRegistry.Table,
  deployMode = ObjectsRegistry.DeployMode;

describe("Validate basic binding of Input widget to Input widget", () => {
  before(() => {
    cy.fixture("Select_table_dsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
  });

  it("1. Validation of default displayed in Select widget based on row selected", function() {
    deployMode.DeployApp();

    //Verify Default selected row is selected by default
    table.ReadTableRowColumnData(0, 0).then(($cellData) => {
      agHelper.ReadSelectedDropDownValue().then(($selectedValue) => {
        expect($cellData).to.eq($selectedValue);
      });
    });

    //Verify able to select dropdown before any table selection
    agHelper.SelectDropDown("#2");
    agHelper.ReadSelectedDropDownValue().then(($selectedValue) => {
      expect($selectedValue).to.eq("#2");
    });

    //Change to an non existing option - by table selecion
    table.SelectTableRow(2);
    agHelper.ReadSelectedDropDownValue().then(($selectedValue) => {
      expect($selectedValue).to.eq("Select option");
    });

    //Change select value now - if below is #2 - it will fail
    agHelper.SelectDropDown("#1");
    agHelper.ReadSelectedDropDownValue().then(($selectedValue) => {
      expect($selectedValue).to.eq("#1");
    });

    agHelper.SelectDropDown("#2");
    agHelper.ReadSelectedDropDownValue().then(($selectedValue) => {
      expect($selectedValue).to.eq("#2");
    });

    agHelper.SelectDropDown("#1");
    agHelper.ReadSelectedDropDownValue().then(($selectedValue) => {
      expect($selectedValue).to.eq("#1");
    });
  });

  it("2. Validation of default displayed in Select widget based on row selected + Bug 12531", function() {
    table.SelectTableRow(1);
    agHelper.ReadSelectedDropDownValue().then(($selectedValue) => {
      expect($selectedValue).to.eq("#2");
    });

    //Change select value now - failing here!
    agHelper.SelectDropDown("#1");
    agHelper.ReadSelectedDropDownValue().then(($selectedValue) => {
      expect($selectedValue).to.eq("#1");
    });

    table.SelectTableRow(2); //Deselecting here!
    agHelper.ReadSelectedDropDownValue().then(($selectedValue) => {
      expect($selectedValue).to.eq("Select option");
    });
  });

  it("3. Verify Selecting the already selected row deselects it", () => {
    table.SelectTableRow(0);
    table.SelectTableRow(0);
    agHelper.ReadSelectedDropDownValue().then(($selectedValue) => {
      expect($selectedValue).to.eq("Select option");
    });
  });
});
