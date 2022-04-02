import { ObjectsRegistry } from "../Objects/Registry"

export class Table {
  public agHelper = ObjectsRegistry.AggregateHelper
  public locator = ObjectsRegistry.CommonLocators

  private _tableWrap = "//div[@class='tableWrap']"
  private _tableHeader = this._tableWrap + "//div[@class='thead']//div[@class='tr'][1]"
  private _columnHeader = (columnName: string) => this._tableWrap + "//div[@class='thead']//div[@class='tr'][1]//div[@role='columnheader']//div[text()='" + columnName + "']/parent::div/parent::div"
  private _nextPage = ".t--widget-tablewidget .t--table-widget-next-page"
  private _previousPage = ".t--widget-tablewidget .t--table-widget-prev-page"
  private _pageNumber = ".t--widget-tablewidget .page-item"
  private _pageNumberServerSideOff = ".t--widget-tablewidget .t--table-widget-page-input input"
  _tableRow = (rowNum: number, colNum: number) => `.t--widget-tablewidget .tbody .td[data-rowindex=${rowNum}][data-colindex=${colNum}]`
  _tableRowColumnData = (rowNum: number, colNum: number) => this._tableRow(rowNum, colNum) + ` div div`
  _tableEmptyColumnData = `.t--widget-tablewidget .tbody .td` //selected-row
  _tableSelectedRow = this._tableWrap + "//div[contains(@class, 'tbody')]//div[contains(@class, 'selected-row')]/div"
  _liNextPage = "li[title='Next Page']"
  _liPreviousPage = "li[title='Previous Page']"
  _liCurrentSelectedPage = "//div[@type='LIST_WIDGET']//ul[contains(@class, 'rc-pagination')]/li[contains(@class, 'rc-pagination-item-active')]/a"


  public WaitUntilTableLoad() {
    // cy.waitUntil(() => cy.xpath(this._table, { timeout: 80000 }).should('be.visible'),
    //   {
    //     errorMsg: "Element did not appear",
    //     timeout: 10000,
    //     interval: 2000
    //   }).then(() => this.agHelper.Sleep(500))

    // this.ReadTableRowColumnData(0, 0).then((cellData) => {
    //   expect(cellData).not.empty;
    // });

    cy.waitUntil(() => this.ReadTableRowColumnData(0, 0),
      {
        errorMsg: "Table is not populated",
        timeout: 10000,
        interval: 2000
      }).then(cellData => {
        expect(cellData).not.empty
        this.agHelper.Sleep(500)
      })
  }

  public WaitForTableEmpty() {
    cy.waitUntil(() => cy.get(this._tableEmptyColumnData),
      {
        errorMsg: "Table is populated when not expected",
        timeout: 10000,
        interval: 2000
      }).then($children => {
        cy.wrap($children).children().should('have.length', 0) //or below
        //expect($children).to.have.lengthOf(0)
        this.agHelper.Sleep(500)
      })
  }

  public AssertTableHeaderOrder(expectedOrder: string) {
    cy.xpath(this._tableHeader).invoke("text").then((x) => {
      expect(x).to.eq(expectedOrder);
    });
  }

  public ReadTableRowColumnData(rowNum: number, colNum: number) {
    this.agHelper.Sleep(2000)//Settling time for table!
    return cy.get(this._tableRowColumnData(rowNum, colNum)).invoke("text");
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

  public NavigateToNextPage() {
    let curPageNo: number;
    cy.get(this._pageNumber).invoke('text').then($currentPageNo =>
      curPageNo = Number($currentPageNo))
    cy.get(this._nextPage).click()
    cy.get(this._pageNumber).invoke('text').then($newPageNo =>
      expect(Number($newPageNo)).to.eq(curPageNo + 1))
  }

  public NavigateToPreviousPage() {
    let curPageNo: number;
    cy.get(this._pageNumber).invoke('text').then($currentPageNo =>
      curPageNo = Number($currentPageNo))
    cy.get(this._previousPage).click()
    cy.get(this._pageNumber).invoke('text').then($newPageNo =>
      expect(Number($newPageNo)).to.eq(curPageNo - 1))
  }

  public AssertPageNumber(pageNo: number, serverSide: 'Off' | 'On' = 'On') {
    if (serverSide == 'On')
      cy.get(this._pageNumber).should('have.text', Number(pageNo))
    else {
      cy.get(this._pageNumberServerSideOff).should('have.value', Number(pageNo))
      cy.get(this._previousPage).should("have.attr", 'disabled')
      cy.get(this._nextPage).should("have.attr", 'disabled')
    }
    if (pageNo == 1)
      cy.get(this._previousPage).should("have.attr", 'disabled')
  }

  public AssertSelectedRow(rowNum: number = 0) {
    cy.xpath(this._tableSelectedRow)
      .invoke("attr", "data-rowindex")
      .then($rowIndex => {
        expect(Number($rowIndex)).to.eq(rowNum);
      });
  }

  public SelectTableRow(rowIndex: number) {
    cy.get(this._tableRow(rowIndex, 0)).first().click({ force: true });
    this.agHelper.Sleep()//for select to reflect
  }

  //List methods - keeping it for now!
  public NavigateToNextPage_List() {
    let curPageNo: number;
    cy.xpath(this._liCurrentSelectedPage).invoke('text').then($currentPageNo =>
      curPageNo = Number($currentPageNo))
    cy.get(this._liNextPage).click()
    cy.scrollTo('top', { easing: 'linear' })
    cy.xpath(this._liCurrentSelectedPage).invoke('text').then($newPageNo =>
      expect(Number($newPageNo)).to.eq(curPageNo + 1))
  }

  public NavigateToPreviousPage_List() {
    let curPageNo: number;
    cy.xpath(this._liCurrentSelectedPage).invoke('text').then($currentPageNo =>
      curPageNo = Number($currentPageNo))
    cy.get(this._liPreviousPage).click()
    cy.scrollTo('top', { easing: 'linear' })
    cy.xpath(this._liCurrentSelectedPage).invoke('text').then($newPageNo =>
      expect(Number($newPageNo)).to.eq(curPageNo - 1))
  }

  public AssertPageNumber_List(pageNo: number, checkNoNextPage = false) {
    cy.xpath(this._liCurrentSelectedPage).invoke('text').then($currentPageNo =>
      expect(Number($currentPageNo)).to.eq(pageNo))

    if (pageNo == 1)
      cy.get(this._liPreviousPage).should("have.attr", "aria-disabled", 'true')

    if (checkNoNextPage)
      cy.get(this._liNextPage).should("have.attr", "aria-disabled", 'true')
    else
      cy.get(this._liNextPage).should("have.attr", "aria-disabled", 'false')

  }
}