import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dataSet: any;
const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  jsEditor = ObjectsRegistry.JSEditor,
  table = ObjectsRegistry.Table;

describe("Verify various Table property bugs", function () {
  before(() => {
    cy.fixture("example").then(function (data: any) {
      dataSet = data;
    });
  });

  it("1. Adding Data to Table Widget", function () {
    ee.DragDropWidgetNVerify("tablewidget", 250, 250);
    jsEditor.EnterJSContext("Table Data", JSON.stringify(dataSet.TableURLColumnType));
    agHelper.ValidateNetworkStatus("@updateLayout", 200);
    cy.get('body').type("{esc}");
  });

  it("2. Bug 13299 - Verify Display Text does not contain garbage value for URL column type when empty", function () {
    table.ChangeColumnType('image', 'URL')
    jsEditor.EnterJSContext("Display Text",
      `{{currentRow.image.toString().includes('7') ? currentRow.image.toString().split('full/')[1] : "" }}`,
      true)

    agHelper.DeployApp()

    //table.SelectTableRow(1)

    table.ReadTableRowColumnData(0, 0).then(($cellData) => {
      expect($cellData).to.eq("1376499.jpg");
    });

    table.ReadTableRowColumnData(1, 0).then(($cellData) => {
      expect($cellData).to.eq("https://wallpaperaccess.com/full/1688623.jpg");
    });

    table.ReadTableRowColumnData(2, 0).then(($cellData) => {
      expect($cellData).to.eq("2117775.jpg");
    });

    table.ReadTableRowColumnData(3, 0).then(($cellData) => {
      expect($cellData).to.eq("https://wallpaperaccess.com/full/812632.jpg");
    });

    table.AssertURLColumnNavigation(0, 0, 'https://wallpaperaccess.com/full/1376499.jpg')
    table.AssertURLColumnNavigation(3, 0, 'https://wallpaperaccess.com/full/812632.jpg')

    agHelper.NavigateBacktoEditor()

  });

  it("3. Bug 13299 - Verify Display Text does not contain garbage value for URL column type when null", function () {
    ee.SelectEntityByName("Table1", 'WIDGETS')
    agHelper.GetNClick(table._columnSettings('image'))

    jsEditor.EnterJSContext("Display Text",
      `{{currentRow.image.toString().includes('7') ? currentRow.image.toString().split('full/')[1] : null }}`,
      true)

    agHelper.DeployApp()

    table.ReadTableRowColumnData(0, 0).then(($cellData) => {
      expect($cellData).to.eq("1376499.jpg");
    });

    table.ReadTableRowColumnData(1, 0).then(($cellData) => {
      expect($cellData).to.eq("https://wallpaperaccess.com/full/1688623.jpg");
    });

    table.ReadTableRowColumnData(2, 0).then(($cellData) => {
      expect($cellData).to.eq("2117775.jpg");
    });

    table.ReadTableRowColumnData(3, 0).then(($cellData) => {
      expect($cellData).to.eq("https://wallpaperaccess.com/full/812632.jpg");
    });

    table.AssertURLColumnNavigation(1, 0, 'https://wallpaperaccess.com/full/1688623.jpg')
    table.AssertURLColumnNavigation(2, 0, 'https://wallpaperaccess.com/full/2117775.jpg')

    agHelper.NavigateBacktoEditor()

  });

  it("4. Bug 13299 - Verify Display Text does not contain garbage value for URL column type when undefined", function () {
    ee.SelectEntityByName("Table1", 'WIDGETS')
    agHelper.GetNClick(table._columnSettings('image'))

    jsEditor.EnterJSContext("Display Text",
      `{{currentRow.image.toString().includes('7') ? currentRow.image.toString().split('full/')[1] : undefined }}`,
      true)

    agHelper.DeployApp()

    table.ReadTableRowColumnData(0, 0).then(($cellData) => {
      expect($cellData).to.eq("1376499.jpg");
    });

    table.ReadTableRowColumnData(1, 0).then(($cellData) => {
      expect($cellData).to.eq("https://wallpaperaccess.com/full/1688623.jpg");
    });

    table.ReadTableRowColumnData(2, 0).then(($cellData) => {
      expect($cellData).to.eq("2117775.jpg");
    });

    table.ReadTableRowColumnData(3, 0).then(($cellData) => {
      expect($cellData).to.eq("https://wallpaperaccess.com/full/812632.jpg");
    });

    table.AssertURLColumnNavigation(0, 0, 'https://wallpaperaccess.com/full/1376499.jpg')
    table.AssertURLColumnNavigation(3, 0, 'https://wallpaperaccess.com/full/812632.jpg')

    agHelper.NavigateBacktoEditor()

  });

})


