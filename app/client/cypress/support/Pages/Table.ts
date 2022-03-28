import { ObjectsRegistry } from "../Objects/Registry"

export class Table {
  public agHelper = ObjectsRegistry.AggregateHelper
  public locator = ObjectsRegistry.CommonLocators

  private _table = "//div[@class='tableWrap']"
  private _tableHeader = this._table + "//div[@class='thead']//div[@class='tr'][1]"
  private _columnHeader = (columnName: string) => "//div[@class='tableWrap']//div[@class='thead']//div[@class='tr'][1]//div[@role='columnheader']//div[text()='" + columnName + "']/parent::div/parent::div"

  public WaitUntilTableLoad() {
    cy.waitUntil(() => cy.xpath(this._table, { timeout: 80000 }).should('be.visible'),
      {
        errorMsg: "Element did not appear",
        timeout: 10000,
        interval: 2000
      }).then(() => this.agHelper.Sleep(500))

    this.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).not.empty;
    });
  }

  public AssertTableHeader(expectedOrder: string) {
    cy.xpath(this._tableHeader).invoke("text").then((x) => {
      expect(x).to.eq(expectedOrder);
    });
  }

  public ReadTableRowColumnData(rowNum: number, colNum: number) {
    return cy.get(this.locator._tableRowColumn(rowNum, colNum)).invoke("text");
  }

  public AssertHiddenColumns(columnNames: string[]) {
    columnNames.forEach($header => {
      cy.xpath(this._columnHeader($header))
        .invoke("attr", "class")
        .then((classes) => {
          expect(classes).includes("hidden-header");
        });
    })
  }



}