import { ObjectsRegistry } from "../Objects/Registry";
const path = require("path");

type filterTypes =
  | "contains"
  | "does not contain"
  | "starts with"
  | "ends with"
  | "is exactly"
  | "empty"
  | "not empty"
  | "is equal to"
  | "not equal to"
  | "greater than"
  | "greater than or equal to"
  | "less than"
  | "less than or equal to";
type columnTypeValues =
  | "Plain Text"
  | "URL"
  | "Number"
  | "Image"
  | "Video"
  | "Date"
  | "Button"
  | "Menu Button"
  | "Icon Button";

export class Table {
  public agHelper = ObjectsRegistry.AggregateHelper;
  public deployMode = ObjectsRegistry.DeployMode;
  public locator = ObjectsRegistry.CommonLocators;

  private _tableWrap = "//div[@class='tableWrap']";
  private _tableHeader =
    this._tableWrap + "//div[@class='thead']//div[@class='tr'][1]";
  private _columnHeader = (columnName: string) =>
    this._tableWrap +
    "//div[@class='thead']//div[@class='tr'][1]//div[@role='columnheader']//span[text()='" +
    columnName +
    "']/parent::div/parent::div/parent::div";
  private _nextPage = ".t--widget-tablewidget .t--table-widget-next-page";
  private _previousPage = ".t--widget-tablewidget .t--table-widget-prev-page";
  private _pageNumberServerSidePagination = ".t--widget-tablewidget .page-item";
  private _pageNumberClientSidePagination =
    ".t--widget-tablewidget .t--table-widget-page-input input";
  _tableRow = (rowNum: number, colNum: number) =>
    `.t--widget-tablewidget .tbody .td[data-rowindex=${rowNum}][data-colindex=${colNum}]`;
  _tableRowColumnData = (rowNum: number, colNum: number) =>
    this._tableRow(rowNum, colNum) + ` div div`;
  _tableLoadStateDelete =
    this._tableRow(0, 0) + ` div div button span:contains('Delete')`;
  _tableRowImageColumnData = (rowNum: number, colNum: number) =>
    this._tableRow(rowNum, colNum) + ` div div.image-cell`;
  _tableEmptyColumnData = `.t--widget-tablewidget .tbody .td`; //selected-row
  _tableSelectedRow =
    this._tableWrap +
    "//div[contains(@class, 'tbody')]//div[contains(@class, 'selected-row')]/div";
  _liNextPage = "li[title='Next Page']";
  _liPreviousPage = "li[title='Previous Page']";
  _liCurrentSelectedPage =
    "//div[@type='LIST_WIDGET']//ul[contains(@class, 'rc-pagination')]/li[contains(@class, 'rc-pagination-item-active')]/a";
  private _searchText = "input[type='search']";
  _searchBoxCross =
    "//div[contains(@class, 't--search-input')]/following-sibling::div";
  _addIcon = "button span[icon='add']";
  _trashIcon = "button span[icon='trash']";
  _visibleTextSpan = (spanText: string) => "//span[text()='" + spanText + "']";
  _filterBtn = ".t--table-filter-toggle-btn";
  _filterColumnsDropdown = ".t--table-filter-columns-dropdown";
  _dropdownText = ".t--dropdown-option";
  _filterConditionDropdown = ".t--table-filter-conditions-dropdown";
  _filterInputValue = ".t--table-filter-value-input";
  private _filterApplyBtn = ".t--apply-filter-btn";
  private _filterCloseBtn = ".t--close-filter-btn";
  private _removeFilter = ".t--table-filter-remove-btn";
  private _clearAllFilter = ".t--clear-all-filter-btn";
  private _addFilter = ".t--add-filter-btn";
  _filterOperatorDropdown = ".t--table-filter-operators-dropdown";
  private _downloadBtn = ".t--table-download-btn";
  private _downloadOption = ".t--table-download-data-option";
  _columnSettings = (columnName: string) =>
    "//input[@placeholder='Column Title'][@value='" +
    columnName +
    "']/parent::div/parent::div/following-sibling::div/div[contains(@class, 't--edit-column-btn')]";
  _showPageItemsCount = "div.show-page-items";
  _filtersCount = this._filterBtn + " span.action-title";

  public WaitUntilTableLoad(rowIndex = 0, colIndex = 0) {
    this.agHelper.GetElement(this._tableRowColumnData(rowIndex, colIndex), 30000).waitUntil(
      ($ele) =>
        cy
          .wrap($ele)
          .children("button")
          .should("have.length", 0)
    );

    //or below will work:
    //this.agHelper.AssertElementAbsence(this._tableLoadStateDelete, 30000);
    // this.agHelper.Sleep(500);
  }

  public WaitForTableEmpty() {
    cy.waitUntil(() => cy.get(this._tableEmptyColumnData), {
      errorMsg: "Table is populated when not expected",
      timeout: 10000,
      interval: 2000,
    }).then(($children) => {
      cy.wrap($children)
        .children()
        .should("have.length", 0); //or below
      //expect($children).to.have.lengthOf(0)
      this.agHelper.Sleep(500);
    });
  }

  public AssertTableHeaderOrder(expectedOrder: string) {
    cy.xpath(this._tableHeader)
      .invoke("text")
      .then((x) => {
        expect(x).to.eq(expectedOrder);
      });
  }

  public ReadTableRowColumnData(
    rowNum: number,
    colNum: number,
    timeout = 1000,
  ) {
    //timeout can be sent higher values incase of larger tables
    this.agHelper.Sleep(timeout); //Settling time for table!
    return this.agHelper
      .GetElement(this._tableRowColumnData(rowNum, colNum), 30000)
      .invoke("text");
  }

  public AssertTableRowImageColumnIsLoaded(
    rowNum: number,
    colNum: number,
    timeout = 200,
  ) {
    //timeout can be sent higher values incase of larger tables
    this.agHelper.Sleep(timeout); //Settling time for table!
    return cy
      .get(this._tableRowImageColumnData(rowNum, colNum))
      .invoke("attr", "style")
      .should("not.be.empty");
  }

  public AssertHiddenColumns(columnNames: string[]) {
    columnNames.forEach(($header) => {
      cy.xpath(this._columnHeader($header))
        .invoke("attr", "class")
        .then((classes) => {
          expect(classes).includes("hidden-header");
        });
    });
  }

  public NavigateToNextPage(isServerPagination = true) {
    let curPageNo: number;
    this.agHelper
      .GetText(
        isServerPagination
          ? this._pageNumberServerSidePagination
          : this._pageNumberClientSidePagination,
        isServerPagination ? "text" : "val",
      )
      .then(($currentPageNo) => (curPageNo = Number($currentPageNo)));
    cy.get(this._nextPage).click();
    this.agHelper
      .GetText(
        isServerPagination
          ? this._pageNumberServerSidePagination
          : this._pageNumberClientSidePagination,
        isServerPagination ? "text" : "val",
      )
      .then(($newPageNo) => expect(Number($newPageNo)).to.eq(curPageNo + 1));
  }

  public NavigateToPreviousPage(isServerPagination = true) {
    let curPageNo: number;
    this.agHelper
      .GetText(
        isServerPagination
          ? this._pageNumberServerSidePagination
          : this._pageNumberClientSidePagination,
        isServerPagination ? "text" : "val",
      )
      .then(($currentPageNo) => (curPageNo = Number($currentPageNo)));
    cy.get(this._previousPage).click();
    this.agHelper
      .GetText(
        isServerPagination
          ? this._pageNumberServerSidePagination
          : this._pageNumberClientSidePagination,
        isServerPagination ? "text" : "val",
      )
      .then(($newPageNo) => expect(Number($newPageNo)).to.eq(curPageNo - 1));
  }

  public AssertPageNumber(pageNo: number, serverSide: "Off" | "On" = "On") {
    if (serverSide == "On")
      cy.get(this._pageNumberServerSidePagination).should(
        "have.text",
        Number(pageNo),
      );
    else {
      cy.get(this._pageNumberClientSidePagination).should(
        "have.value",
        Number(pageNo),
      );
      cy.get(this._previousPage).should("have.attr", "disabled");
      cy.get(this._nextPage).should("have.attr", "disabled");
    }
    if (pageNo == 1) cy.get(this._previousPage).should("have.attr", "disabled");
  }

  public AssertSelectedRow(rowNum: number = 0) {
    cy.xpath(this._tableSelectedRow)
      .invoke("attr", "data-rowindex")
      .then(($rowIndex) => {
        expect(Number($rowIndex)).to.eq(rowNum);
      });
  }

  public SelectTableRow(rowIndex: number, columnIndex = 0, select = true) {
    //rowIndex - 0 for 1st row
    this.agHelper
      .GetElement(this._tableRow(rowIndex, columnIndex))
      .parent("div")
      .invoke("attr", "class")
      .then(($classes: any) => {
        if (
          (select && !$classes?.includes("selected-row")) ||
          (!select && $classes?.includes("selected-row"))
        )
          this.agHelper.GetNClick(
            this._tableRow(rowIndex, columnIndex),
            0,
            true,
          );
      });

    this.agHelper.Sleep(); //for select to reflect
  }

  public AssertSearchText(searchTxt: string) {
    cy.get(this._searchText).should("have.value", searchTxt);
  }

  public SearchTable(searchTxt: string, index = 0) {
    cy.get(this._searchText)
      .eq(index)
      .type(searchTxt);
  }

  public RemoveSearchTextNVerify(cellDataAfterSearchRemoved: string) {
    this.agHelper.GetNClick(this._searchBoxCross);
    this.ReadTableRowColumnData(0, 0).then((aftSearchRemoved: any) => {
      expect(aftSearchRemoved).to.eq(cellDataAfterSearchRemoved);
    });
  }

  public OpenFilter() {
    this.agHelper.GetNClick(this._filterBtn);
  }

  public OpenNFilterTable(
    colName: string,
    colCondition: filterTypes,
    inputText = "",
    operator: "AND" | "OR" | "" = "",
    index = 0,
  ) {
    if (operator) {
      this.agHelper.GetNClick(this._addFilter);
      this.agHelper.GetNClick(this._filterOperatorDropdown);
      this.agHelper.GetNClickByContains(this.locator._dropdownText, operator);
    } else this.OpenFilter();

    this.agHelper.GetNClick(this._filterColumnsDropdown, index);
    this.agHelper.GetNClickByContains(this.locator._dropdownText, colName);
    this.agHelper.GetNClick(this._filterConditionDropdown, index);
    this.agHelper.GetNClickByContains(this.locator._dropdownText, colCondition);

    if (inputText)
      this.agHelper
        .GetNClick(this._filterInputValue, index)
        .type(inputText)
        .wait(500);

    this.agHelper.GetNClick(this._filterApplyBtn);
    //this.agHelper.ClickButton("APPLY")
  }

  public RemoveFilterNVerify(
    cellDataAfterFilterRemoved: string,
    toClose = true,
    removeOne = true,
    index = 0,
  ) {
    if (removeOne) this.agHelper.GetNClick(this._removeFilter, index);
    else this.agHelper.GetNClick(this._clearAllFilter);

    if (toClose) this.CloseFilter();
    this.ReadTableRowColumnData(0, 0).then((aftFilterRemoved: any) => {
      expect(aftFilterRemoved).to.eq(cellDataAfterFilterRemoved);
    });
  }

  public CloseFilter() {
    this.agHelper.GetNClick(this._filterCloseBtn);
  }

  public DownloadFromTable(filetype: "Download as CSV" | "Download as Excel") {
    cy.get(this._downloadBtn).click({ force: true });
    cy.get(this._downloadOption)
      .contains(filetype)
      .click({ force: true });
  }

  public ValidateDownloadNVerify(fileName: string, textToBePresent: string) {
    let downloadsFolder = Cypress.config("downloadsFolder");
    cy.log("downloadsFolder is:" + downloadsFolder);
    cy.readFile(path.join(downloadsFolder, fileName)).should("exist");
    this.VerifyDownloadedFile(fileName, textToBePresent);
  }

  public VerifyDownloadedFile(fileName: string, textToBePresent: string) {
    const downloadedFilename = Cypress.config("downloadsFolder")
      .concat("/")
      .concat(fileName);
    cy.readFile(downloadedFilename, "binary", {
      timeout: 15000,
    }).should((buffer) => expect(buffer).to.contain(textToBePresent));
  }

  public ChangeColumnType(columnName: string, newDataType: columnTypeValues) {
    this.agHelper.GetNClick(this._columnSettings(columnName));
    this.agHelper.SelectDropdownList("Column Type", newDataType);
    this.agHelper.ValidateNetworkStatus("@updateLayout");
  }

  public AssertURLColumnNavigation(
    row: number,
    col: number,
    expectedURL: string,
  ) {
    this.deployMode.StubbingWindow();
    this.agHelper
      .GetNClick(this._tableRowColumnData(row, col))
      .then(($cellData) => {
        //Cypress.$($cellData).trigger('click');
        cy.url().should("eql", expectedURL);
        this.agHelper.Sleep();
        cy.go(-1);
        this.WaitUntilTableLoad();
      });
  }

  //List methods - keeping it for now!
  public NavigateToNextPage_List() {
    let curPageNo: number;
    cy.xpath(this._liCurrentSelectedPage)
      .invoke("text")
      .then(($currentPageNo) => (curPageNo = Number($currentPageNo)));
    cy.get(this._liNextPage).click();
    //cy.scrollTo('top', { easing: 'linear' })
    cy.xpath(this._liCurrentSelectedPage)
      .invoke("text")
      .then(($newPageNo) => expect(Number($newPageNo)).to.eq(curPageNo + 1));
  }

  public NavigateToPreviousPage_List() {
    let curPageNo: number;
    cy.xpath(this._liCurrentSelectedPage)
      .invoke("text")
      .then(($currentPageNo) => (curPageNo = Number($currentPageNo)));
    cy.get(this._liPreviousPage).click();
    //cy.scrollTo('top', { easing: 'linear' })
    cy.xpath(this._liCurrentSelectedPage)
      .invoke("text")
      .then(($newPageNo) => expect(Number($newPageNo)).to.eq(curPageNo - 1));
  }

  public AssertPageNumber_List(pageNo: number, checkNoNextPage = false) {
    cy.xpath(this._liCurrentSelectedPage)
      .invoke("text")
      .then(($currentPageNo) => expect(Number($currentPageNo)).to.eq(pageNo));

    if (pageNo == 1)
      cy.get(this._liPreviousPage).should("have.attr", "aria-disabled", "true");

    if (checkNoNextPage)
      cy.get(this._liNextPage).should("have.attr", "aria-disabled", "true");
    else cy.get(this._liNextPage).should("have.attr", "aria-disabled", "false");
  }
}
