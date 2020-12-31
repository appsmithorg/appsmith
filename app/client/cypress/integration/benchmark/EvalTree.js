const dsl = {
  widgetName: "MainContainer",
  backgroundColor: "none",
  rightColumn: 1224,
  snapColumns: 16,
  detachFromLayout: true,
  widgetId: "0",
  topRow: 0,
  bottomRow: 1280,
  containerStyle: "none",
  snapRows: 33,
  parentRowSpace: 1,
  type: "CANVAS_WIDGET",
  canExtend: true,
  version: 7,
  minHeight: 1292,
  parentColumnSpace: 1,
  dynamicBindingPathList: [],
  leftColumn: 0,
  children: [
    {
      isVisible: true,
      label: "Data",
      widgetName: "Table1",
      searchKey: "",
      tableData:
        '[\n  {\n    "id": 2381224,\n    "email": "michael.lawson@reqres.in",\n    "userName": "Michael Lawson",\n    "productName": "Chicken Sandwich",\n    "orderAmount": 4.99\n  },\n  {\n    "id": 2736212,\n    "email": "lindsay.ferguson@reqres.in",\n    "userName": "Lindsay Ferguson",\n    "productName": "Tuna Salad",\n    "orderAmount": 9.99\n  },\n  {\n    "id": 6788734,\n    "email": "tobias.funke@reqres.in",\n    "userName": "Tobias Funke",\n    "productName": "Beef steak",\n    "orderAmount": 19.99\n  }\n]',
      type: "TABLE_WIDGET",
      isLoading: false,
      parentColumnSpace: 74,
      parentRowSpace: 40,
      leftColumn: 3,
      rightColumn: 11,
      topRow: 4,
      bottomRow: 11,
      parentId: "0",
      widgetId: "t0dlvyzgfq",
      dynamicBindingPathList: [],
    },
    {
      isVisible: true,
      inputType: "TEXT",
      label: "",
      widgetName: "Input1",
      type: "INPUT_WIDGET",
      isLoading: false,
      parentColumnSpace: 74,
      parentRowSpace: 40,
      leftColumn: 3,
      rightColumn: 8,
      topRow: 1,
      bottomRow: 2,
      parentId: "0",
      widgetId: "f982nzje5b",
      dynamicBindingPathList: [{ key: "defaultText" }],
      defaultText: "{{Text1.text}}",
    },
    {
      isVisible: true,
      text: "{{Table1.selectedRow.email}}",
      textStyle: "LABEL",
      textAlign: "LEFT",
      widgetName: "Text1",
      type: "TEXT_WIDGET",
      isLoading: false,
      parentColumnSpace: 74,
      parentRowSpace: 40,
      leftColumn: 2,
      rightColumn: 6,
      topRow: 2,
      bottomRow: 3,
      parentId: "0",
      widgetId: "pc11vmo62g",
      dynamicBindingPathList: [{ key: "text" }],
    },
  ],
};
describe("Benchmark EvalTree", function() {
  before(() => {
    cy.addDsl({ dsl });
  });
  it("run 100 times", function() {
    for (let i = 0; i < 100; i++) {
      cy.isSelectRow(i % 2);
      cy.wait(2000);
    }
  });
});
