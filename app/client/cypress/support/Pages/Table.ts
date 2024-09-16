import { ObjectsRegistry } from "../Objects/Registry";
import sampleTableData from "../../fixtures/Table/sampleTableData.json";

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
  | "Plain text"
  | "URL"
  | "Number"
  | "Image"
  | "Video"
  | "Date"
  | "Button"
  | "Menu button"
  | "Icon button"
  | "Select";

export class Table {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private deployMode = ObjectsRegistry.DeployMode;
  private locator = ObjectsRegistry.CommonLocators;
  private propPane = ObjectsRegistry.PropertyPane;
  private assertHelper = ObjectsRegistry.AssertHelper;

  private _tableWrap = "//div[contains(@class,'tableWrap')]";
  private _tableHeader = ".thead div[role=columnheader]";
  private _columnHeader = (columnName: string) =>
    this._tableWrap +
    "//div[contains(@class,'thead')]//div[contains(@class,'tr')][1]//div[@role='columnheader']//div[contains(text(),'" +
    columnName +
    "')]/parent::div/parent::div";
  _columnHeaderDiv = (columnName: string) => `[data-header=${columnName}]`;
  private _tableWidgetVersion = (version: "v1" | "v2") =>
    `.t--widget-tablewidget${version == "v1" ? "" : version}`;
  private _nextPage = (version: "v1" | "v2") =>
    this._tableWidgetVersion(version) + " .t--table-widget-next-page";
  private _previousPage = (version: "v1" | "v2") =>
    this._tableWidgetVersion(version) + " .t--table-widget-prev-page";
  private _pageNumber = ".t--widget-tablewidgetv2 .page-item";
  private _pageNumberServerSideOff =
    ".t--widget-tablewidgetv2 .t--table-widget-page-input input";
  private _pageNumberServerSidePagination = ".t--widget-tablewidget .page-item";
  private _pageNumberClientSidePagination =
    ".t--widget-tablewidget .t--table-widget-page-input input";
  _tableRow = (rowNum: number, colNum: number, version: "v1" | "v2") =>
    this._tableWidgetVersion(version) +
    ` .tbody .td[data-rowindex=${rowNum}][data-colindex=${colNum}]`;
  _tableColumnDataWithText = (
    colNum: number,
    columnText: string,
    version: "v1" | "v2",
  ) =>
    this._tableWidgetVersion(version) +
    ` .tbody .td[data-colindex=${colNum}]` +
    this._tableRowColumnDataVersion(version) +
    ` div:contains("${columnText}")`;
  _tableRowColumns = (rowNum: number, version: "v1" | "v2") =>
    this._tableWidgetVersion(version) + ` .tbody .td[data-rowindex=${rowNum}]`;
  _editCellIconDiv = ".t--editable-cell-icon";
  _editCellEditor = ".t--inlined-cell-editor";
  _editCellEditorInput = this._editCellEditor + " input";
  _tableRowColumnDataVersion = (version: "v1" | "v2") =>
    `${version == "v1" ? " div div" : " .cell-wrapper"}`;
  _tableRowColumnData = (
    rowNum: number,
    colNum: number,
    version: "v1" | "v2",
  ) =>
    this._tableRow(rowNum, colNum, version) +
    this._tableRowColumnDataVersion(version);
  _tableLoadStateDelete = (version: "v1" | "v2") =>
    this._tableRow(0, 0, version) + ` div div button span:contains('Delete')`;
  _tableRowImageColumnData = (
    rowNum: number,
    colNum: number,
    version: "v1" | "v2",
  ) => this._tableRow(rowNum, colNum, version) + ` div div.image-cell`;
  _tableEmptyColumnData = (version: "v1" | "v2") =>
    this._tableWidgetVersion(version) + " .tbody .td"; //selected-row
  _tableSelectedRow =
    this._tableWrap +
    "//div[contains(@class, 'tbody')]//div[contains(@class, 'selected-row')]/div";
  _liNextPage = "li[title='Next Page']";
  _liPreviousPage = "li[title='Previous Page']";
  _liCurrentSelectedPage =
    "//div[@type='LIST_WIDGET']//ul[contains(@class, 'rc-pagination')]/li[contains(@class, 'rc-pagination-item-active')]/a";
  private _tr = ".tbody .tr";
  private _searchTableInput = "input[type='search'][placeholder='Search...']";
  _searchBoxCross =
    "//div[contains(@class, 't--search-input')]/following-sibling::div";
  _addIcon = "button .bp3-icon-add";
  _trashIcon = "button span[icon='trash']";
  _visibleTextSpan = (spanText: string) => "//span[text()='" + spanText + "']";
  _filterBtn = ".t--table-filter-toggle-btn";
  _filterColumnsDropdown = ".t--table-filter-columns-dropdown";
  _dropdownText = ".t--dropdown-option";
  _filterConditionDropdown = ".t--table-filter-conditions-dropdown";
  _filterInputValue = ".t--table-filter-value-input input";
  _addColumn = ".t--add-column-btn";
  _deleteColumn = ".t--delete-column-btn";
  _defaultColName =
    "[data-rbd-draggable-id='customColumn1'] input[type='text']";
  private _filterApplyBtn = ".t--apply-filter-btn";
  private _filterCloseBtn = ".t--close-filter-btn";
  private _removeFilter = ".t--table-filter-remove-btn";
  private _clearAllFilter = ".t--clear-all-filter-btn";
  private _addFilter = ".t--add-filter-btn";
  _filterOperatorDropdown = ".t--table-filter-operators-dropdown";
  private _downloadBtn = ".t--table-download-btn";
  private _downloadOption = ".t--table-download-data-option";
  _columnSettings = (
    columnName: string,
    type: "Edit" | "Visibility" | "Editable",
  ) => {
    const classMap = {
      Edit: "t--edit-column-btn",
      Visibility: "t--show-column-btn",
      Editable: "t--card-checkbox",
    };
    const classToCheck = classMap[type];
    return `//input[@placeholder='Column title'][@value='${columnName}']/parent::div/parent::div/parent::div/parent::div/following-sibling::div/*[contains(@class, '${classToCheck}')]`;
  };
  _columnSettingsV2 = (
    columnName: string,
    type: "Edit" | "Visibility" | "Editable",
  ) => {
    const classMap = {
      Edit: ".t--edit-column-btn",
      Visibility: ".t--show-column-btn",
      Editable: ".t--card-checkbox",
    };
    const classToCheck = classMap[type];
    return `.t--property-pane-view .tablewidgetv2-primarycolumn-list div[data-rbd-draggable-id=${columnName}] ${classToCheck}`;
  };
  _showPageItemsCount = "div.show-page-items";
  _filtersCount = this._filterBtn + " span.action-title";
  _headerCell = (column: string) =>
    `.t--widget-tablewidgetv2 .thead .th:contains(${column})`;
  public _addNewRow = ".t--add-new-row";
  _saveNewRow = ".t--save-new-row";
  _discardRow = ".t--discard-new-row";
  _searchInput = ".t--search-input input";
  _bodyCell = (cellValue: string) =>
    `.t--table-text-cell:contains(${cellValue})`;
  private _newRow = ".new-row";
  _connectDataHeader = ".t--cypress-table-overlay-header";
  _connectDataButton = ".t--cypress-table-overlay-connectdata";
  _updateMode = (mode: "Single" | "Multi") =>
    "//span[text()='" + mode + " Row']/ancestor::div";
  _hideMenu = ".hide-menu";
  _tableColumnHeaderMenuTrigger = (columnName: string) =>
    `${this._columnHeaderDiv(columnName)} .header-menu .bp3-popover2-target`;
  _columnHeaderMenu = ".bp3-menu";
  _selectMenuItem = ".menu-item-text";
  _columnCheckbox = (columnName: string) =>
    "[data-rbd-draggable-id='" + columnName + "']" + " .t--card-checkbox input";
  _dateInputPopover = ".bp3-dateinput-popover";
  _tableV2Widget = ".t--draggable-tablewidgetv2";
  _tableV2Row = ".t--draggable-tablewidgetv2 .tbody";
  _weekdayRowDayPicker =
    ".bp3-datepicker .DayPicker .DayPicker-Months .DayPicker-WeekdaysRow";
  _popoverErrorMsg = (msg: string) =>
    "//div[@class='bp3-popover-content' and contains(text(),'" + msg + "')]";
  _datePicker = ".bp3-datepicker";
  _dayPickerWeek = ".bp3-datepicker .DayPicker .DayPicker-Body .DayPicker-Week";
  _timePickerHour = ".bp3-timepicker-input-row .bp3-timepicker-hour";
  _timePickerMinute = ".bp3-timepicker-input-row .bp3-timepicker-minute";
  _timePickerSecond = ".bp3-timepicker-input-row .bp3-timepicker-second";
  _timePickerRow = ".bp3-timepicker-input-row";
  _tableV2Head = ".t--draggable-tablewidgetv2 .thead";
  _timeprecisionPopover =
    ".t--property-control-timeprecision .bp3-popover-target";
  _tableRow1Child3 =
    ".t--draggable-tablewidgetv2 .tbody .tr:nth-child(1) div:nth-child(3)";
  _draggableHeader = " .draggable-header";
  _lastChildDatePicker = "div:last-child .react-datepicker-wrapper";
  _codeMirrorError = ".t--codemirror-has-error";
  _canvasWidgetType = "[type='CANVAS_WIDGET']";
  _showArrow = ".rc-select-show-arrow";
  _codeEditorWrapper = ".t--code-editor-wrapper";
  _dateRangePickerShortcuts =
    ".bp3-dateinput-popover .bp3-daterangepicker-shortcuts";
  _dayPickerFirstChild = ".DayPicker-Day:first-child";
  _divFirstChild = "div:first-child abbr";
  _listPreviousPage = ".rc-pagination-prev";
  _listNavigation = (move: string) =>
    "//button[@aria-label='" + move + " page']";
  _listNextPage = ".rc-pagination-next";
  _listActivePage = (version: "v1" | "v2") =>
    `.t--widget-listwidget${
      version == "v1" ? "" : version
    } .rc-pagination-item-active`;
  _paginationItem = (value: number) => `.rc-pagination-item-${value}`;
  _cellWrapOff = "//div[@class='tableWrap virtual']";
  _cellWrapOn = "//div[@class='tableWrap']";
  _multirowselect = ".t--table-multiselect";
  _selectedrow = ".selected-row";

  public GetNumberOfRows() {
    return this.agHelper.GetElement(this._tr).its("length");
  }

  public WaitUntilTableLoad(
    rowIndex = 0,
    colIndex = 0,
    tableVersion: "v1" | "v2" = "v1",
  ) {
    // this.agHelper
    // .GetElement(this._tableRowColumnData(rowIndex, colIndex, tableVersion), 30000)
    // .waitUntil(($ele) =>
    //   cy
    //     .wrap($ele)
    //     .children("button")
    //     .should("have.length", 0),
    // );
    //or above will also work:
    this.agHelper.AssertElementAbsence(
      this._tableLoadStateDelete(tableVersion),
      30000,
    ); //For CURD generated pages Delete button appears first when table is loading & not fully loaded, hence validating that here!
    cy.waitUntil(
      () => this.ReadTableRowColumnData(rowIndex, colIndex, tableVersion),
      {
        errorMsg: "Table is not populated",
        timeout: 10000,
        interval: 2000,
      },
    ).then((cellData) => {
      expect(cellData).not.empty;
    });
    this.agHelper.Sleep(500); //for table to settle loading!
  }

  public AssertTableLoaded(
    rowIndex = 0,
    colIndex = 0,
    tableVersion: "v1" | "v2" = "v1",
  ) {
    this.agHelper
      .GetElement(this._tableRowColumnData(rowIndex, colIndex, tableVersion))
      .waitUntil(($ele) =>
        cy.wrap($ele).children("span").should("not.be.empty"),
      );
  }

  public WaitForTableEmpty(tableVersion: "v1" | "v2" = "v1") {
    this.agHelper
      .GetElement(this._tableEmptyColumnData(tableVersion), "noVerify")
      .children()
      .should("have.length", 0); //or below
    //expect($children).to.have.lengthOf(0)
    this.agHelper.Sleep(500);
  }

  public AssertTableHeaderOrder(expectedOrder: string) {
    cy.get(this._tableHeader)
      .invoke("text")
      .then((x) => {
        expect(x).to.eq(expectedOrder);
      });
  }

  public AssertColumnFreezeStatus(columnName: string, freezed = true) {
    if (freezed) {
      this.agHelper
        .GetElement(this._columnHeaderDiv(columnName))
        .then(($elem) => {
          expect($elem.attr("data-sticky-td")).to.equal("true");
        });
    } else {
      this.agHelper
        .GetElement(this._columnHeaderDiv(columnName))
        .should("not.have.attr", "data-sticky-td");
    }
  }

  public ReadTableRowColumnData(
    rowNum: number,
    colNum: number,
    tableVersion: "v1" | "v2" = "v1",
    timeout = 1000,
  ) {
    //timeout can be sent higher values incase of larger tables
    this.agHelper.Sleep(timeout); //Settling time for table!
    return this.agHelper
      .GetElement(this._tableRowColumnData(rowNum, colNum, tableVersion))
      .invoke("text");
  }

  public VerifyDataInRow(
    rowNum: number,
    tableVersion: "v1" | "v2" = "v1",
    text: string[] | string,
  ) {
    this.agHelper
      .GetElement(this._tableRowColumns(rowNum, tableVersion))
      .then(($elements: any) => {
        const rowColumnTexts: string[] = [];
        $elements.each((_: number, element: any) => {
          const eleText = Cypress.$(element).text().trim();
          rowColumnTexts.push(eleText);
        });
        if (typeof text === "string") {
          expect(rowColumnTexts).to.include(text);
        } else {
          cy.wrap(text).each((textItem: string) => {
            expect(rowColumnTexts).to.include(textItem);
          });
        }
      });
  }

  public AssertTableRowImageColumnIsLoaded(
    rowNum: number,
    colNum: number,
    timeout = 200,
    tableVersion: "v1" | "v2" = "v1",
  ) {
    //timeout can be sent higher values incase of larger tables
    this.agHelper.Sleep(timeout); //Settling time for table!
    return cy
      .get(this._tableRowImageColumnData(rowNum, colNum, tableVersion))
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

  public NavigateToNextPage(
    isServerPagination = true,
    tableVersion: "v1" | "v2" = "v1",
  ) {
    let curPageNo: number;
    if (tableVersion == "v1") {
      this.agHelper
        .GetText(
          isServerPagination
            ? this._pageNumberServerSidePagination
            : this._pageNumberClientSidePagination,
          isServerPagination ? "text" : "val",
        )
        .then(($currentPageNo) => (curPageNo = Number($currentPageNo)));
      cy.get(this._nextPage(tableVersion)).click();
      this.agHelper
        .GetText(
          isServerPagination
            ? this._pageNumberServerSidePagination
            : this._pageNumberClientSidePagination,
          isServerPagination ? "text" : "val",
        )
        .then(($newPageNo) => expect(Number($newPageNo)).to.eq(curPageNo + 1));
    } else if (tableVersion == "v2") {
      cy.get(this._pageNumber)
        .invoke("text")
        .then(($currentPageNo) => (curPageNo = Number($currentPageNo)));
      cy.get(this._nextPage(tableVersion)).click();
      cy.get(this._pageNumber)
        .invoke("text")
        .then(($newPageNo) => expect(Number($newPageNo)).to.eq(curPageNo + 1));
    }
  }

  public NavigateToPreviousPage(
    isServerPagination = true,
    tableVersion: "v1" | "v2" = "v1",
  ) {
    let curPageNo: number;
    if (tableVersion == "v1") {
      this.agHelper
        .GetText(
          isServerPagination
            ? this._pageNumberServerSidePagination
            : this._pageNumberClientSidePagination,
          isServerPagination ? "text" : "val",
        )
        .then(($currentPageNo) => (curPageNo = Number($currentPageNo)));
      cy.get(this._previousPage(tableVersion)).click();
      this.agHelper
        .GetText(
          isServerPagination
            ? this._pageNumberServerSidePagination
            : this._pageNumberClientSidePagination,
          isServerPagination ? "text" : "val",
        )
        .then(($newPageNo) => expect(Number($newPageNo)).to.eq(curPageNo - 1));
    } else if (tableVersion == "v2") {
      cy.get(this._pageNumber)
        .invoke("text")
        .then(($currentPageNo) => (curPageNo = Number($currentPageNo)));
      cy.get(this._previousPage(tableVersion)).click();
      cy.get(this._pageNumber)
        .invoke("text")
        .then(($newPageNo) => expect(Number($newPageNo)).to.eq(curPageNo - 1));
    }
  }

  public AssertPageNumber(
    pageNo: number,
    serverSide: "Off" | "On" | "" = "On",
    tableVersion: "v1" | "v2" = "v1",
  ) {
    const serverSideOn =
      tableVersion == "v1"
        ? this._pageNumberServerSidePagination
        : this._pageNumber;
    const serverSideOff =
      tableVersion == "v1"
        ? this._pageNumberClientSidePagination
        : this._pageNumberServerSideOff;

    if (serverSide == "On")
      cy.get(serverSideOn).should("have.text", Number(pageNo));
    else {
      cy.get(serverSideOff).should("have.value", Number(pageNo));
      cy.get(this._previousPage(tableVersion)).should("have.attr", "disabled");
      cy.get(this._nextPage(tableVersion)).should("have.attr", "disabled");
    }
    if (pageNo == 1)
      cy.get(this._previousPage(tableVersion)).should("have.attr", "disabled");
  }

  public AssertSelectedRow(rowNum = 0) {
    cy.xpath(this._tableSelectedRow)
      .invoke("attr", "data-rowindex")
      .then(($rowIndex) => {
        expect(Number($rowIndex)).to.eq(rowNum);
      });
  }

  public SelectTableRow(
    rowIndex: number,
    columnIndex = 0,
    select = true,
    tableVersion: "v1" | "v2" = "v1",
  ) {
    //rowIndex - 0 for 1st row
    this.agHelper
      .GetElement(this._tableRow(rowIndex, columnIndex, tableVersion))
      .parent("div")
      .invoke("attr", "class")
      .then(($classes: any) => {
        if (
          (select && !$classes?.includes("selected-row")) ||
          (!select && $classes?.includes("selected-row"))
        )
          this.agHelper.GetNClick(
            this._tableRow(rowIndex, columnIndex, tableVersion),
            0,
            true,
          );
      });

    this.agHelper.Sleep(); //for select to reflect
  }

  public AssertSearchText(searchTxt: string, index = 0) {
    cy.get(this._searchTableInput).eq(index).should("have.value", searchTxt);
  }

  public SearchTable(searchTxt: string, index = 0) {
    this.agHelper.TypeText(this._searchTableInput, searchTxt, index);
  }

  public ResetSearch() {
    this.agHelper.GetNClick(this._searchBoxCross);
  }

  public RemoveSearchTextNVerify(
    cellDataAfterSearchRemoved: string,
    tableVersion: "v1" | "v2" = "v1",
  ) {
    this.ResetSearch();
    this.ReadTableRowColumnData(0, 0, tableVersion).then(
      (aftSearchRemoved: any) => {
        expect(aftSearchRemoved).to.eq(cellDataAfterSearchRemoved);
      },
    );
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

  public RemoveFilter(toClose = true, removeOne = false, index = 0) {
    if (removeOne) this.agHelper.GetNClick(this._removeFilter, index);
    else this.agHelper.GetNClick(this._clearAllFilter);
    if (toClose) this.CloseFilter();
  }

  public RemoveFilterNVerify(
    cellDataAfterFilterRemoved: string,
    toClose = true,
    removeOne = true,
    index = 0,
    tableVersion: "v1" | "v2" = "v1",
  ) {
    this.RemoveFilter(toClose, removeOne, index);
    this.ReadTableRowColumnData(0, 0, tableVersion).then(
      (aftFilterRemoved: any) => {
        expect(aftFilterRemoved).to.eq(cellDataAfterFilterRemoved);
      },
    );
  }

  public CloseFilter() {
    this.agHelper.GetNClick(this._filterCloseBtn);
  }

  public DownloadFromTable(filetype: "Download as CSV" | "Download as Excel") {
    cy.get(this._downloadBtn).click({ force: true });
    cy.get(this._downloadOption).contains(filetype).click({ force: true });
  }

  public ValidateDownloadNVerify(fileName: string, textToBePresent = "") {
    let downloadsFolder = Cypress.config("downloadsFolder");
    cy.log("downloadsFolder is:" + downloadsFolder);
    cy.readFile(path.join(downloadsFolder, fileName)).should("exist");
    textToBePresent && this.VerifyDownloadedFile(fileName, textToBePresent);
  }

  public VerifyDownloadedFile(fileName: string, textToBePresent: string) {
    const downloadedFilename = Cypress.config("downloadsFolder")
      .concat("/")
      .concat(fileName);
    cy.readFile(downloadedFilename, "binary", {
      timeout: 15000,
    }).should((buffer) => expect(buffer).to.contain(textToBePresent));
  }

  public ChangeColumnType(
    columnName: string,
    newDataType: columnTypeValues,
    tableVersion: "v1" | "v2" = "v1",
  ) {
    this.EditColumn(columnName, tableVersion);
    this.propPane.SelectPropertiesDropDown("Column type", newDataType);
    this.assertHelper.AssertNetworkStatus("@updateLayout");
    if (tableVersion == "v2") this.propPane.NavigateBackToPropertyPane();
  }

  public AssertURLColumnNavigation(
    row: number,
    col: number,
    expectedURL: string,
    tableVersion: "v1" | "v2" = "v1",
    networkCall = "getConsolidatedData",
  ) {
    this.deployMode.StubWindowNAssert(
      this._tableRowColumnData(row, col, tableVersion),
      expectedURL,
      networkCall,
    );
    this.WaitUntilTableLoad(0, 0, tableVersion);
  }

  public AddNewRow() {
    this.agHelper.GetNClick(this._addNewRow);
    this.agHelper.AssertElementExist(this._newRow);
  }

  public AddColumn(colId: string) {
    cy.get(this._addColumn).scrollIntoView();
    cy.get(this._addColumn).should("be.visible").click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(3000);
    cy.get(this._defaultColName).clear({
      force: true,
    });
    cy.get(this._defaultColName).type(colId, { force: true });
  }

  public toggleColumnEditableViaColSettingsPane(
    columnName: string,
    tableVersion: "v1" | "v2" = "v2",
    editable = true,
    goBackToPropertyPane = true,
  ) {
    this.EditColumn(columnName, tableVersion);
    this.propPane.TogglePropertyState(
      "Editable",
      editable === true ? "On" : "Off",
    );
    goBackToPropertyPane && this.propPane.NavigateBackToPropertyPane();
  }

  public EditColumn(columnName: string, tableVersion: "v1" | "v2") {
    const colSettings =
      tableVersion == "v1"
        ? this._columnSettings(columnName, "Edit")
        : this._columnSettingsV2(columnName, "Edit");
    this.agHelper.GetNClick(colSettings);
  }

  public EnableVisibilityOfColumn(
    columnName: string,
    tableVersion: "v1" | "v2",
  ) {
    const colSettings =
      tableVersion == "v1"
        ? this._columnSettings(columnName, "Visibility")
        : this._columnSettingsV2(columnName, "Visibility");
    this.agHelper.GetNClick(colSettings);
  }

  public EnableEditableOfColumn(
    columnName: string,
    tableVersion: "v1" | "v2" = "v2",
  ) {
    const colSettings =
      tableVersion == "v1"
        ? this._columnSettings(columnName, "Editable")
        : this._columnSettingsV2(columnName, "Editable");
    this.agHelper.GetNClick(colSettings);
  }

  public ClickOnEditIcon(rowIndex: number, colIndex: number) {
    this.agHelper.HoverElement(this._tableRow(rowIndex, colIndex, "v2"));
    this.agHelper.GetNClick(
      this._tableRow(rowIndex, colIndex, "v2") + " " + this._editCellIconDiv,
      0,
      true,
    );
    this.agHelper.AssertElementVisibility(
      this._tableRow(rowIndex, colIndex, "v2") +
        " " +
        this._editCellEditorInput,
    );
  }

  public EditTableCell(
    rowIndex: number,
    colIndex: number,
    newValue: "" | number | string,
    toSaveNewValue = true,
  ) {
    this.ClickOnEditIcon(rowIndex, colIndex);
    this.UpdateTableCell(
      rowIndex,
      colIndex,
      newValue.toString(),
      toSaveNewValue,
    );
    this.agHelper.Sleep();
  }

  public UpdateTableCell(
    rowIndex: number,
    colIndex: number,
    newValue: "" | number | string,
    toSaveNewValue = false,
    force = false,
  ) {
    this.agHelper.ClearNType(
      this._tableRow(rowIndex, colIndex, "v2") +
        " " +
        this._editCellEditorInput,
      newValue.toString(),
    );
    toSaveNewValue &&
      this.agHelper.TypeText(this._editCellEditorInput, "{enter}", {
        parseSpecialCharSeq: true,
      });
  }

  public DeleteColumn(colId: string) {
    this.propPane.NavigateBackToPropertyPane();
    cy.get(
      "[data-rbd-draggable-id='" + colId + "'] .t--delete-column-btn",
    ).click({
      force: true,
    });
    cy.wait(1000);
  }

  //List methods - keeping it for now!
  public NavigateToNextPage_List(tableVersion: "v1" | "v2" = "v1", index = 0) {
    let curPageNo: number;
    if (tableVersion == "v1") {
      cy.xpath(this._liCurrentSelectedPage)
        .invoke("text")
        .then(($currentPageNo) => (curPageNo = Number($currentPageNo)));
      cy.get(this._listNextPage).click();
      //cy.scrollTo('top', { easing: 'linear' })
      cy.xpath(this._liCurrentSelectedPage)
        .invoke("text")
        .then(($newPageNo) => expect(Number($newPageNo)).to.eq(curPageNo + 1));
    } else if (tableVersion == "v2") {
      this.agHelper
        .GetText(this._listActivePage(tableVersion), "text", index)
        .then(($currentPageNo) => (curPageNo = Number($currentPageNo)));
      this.agHelper.GetNClick(this._listNextPage, index);
      this.agHelper.Sleep(1000);
      this.agHelper
        .GetText(this._listActivePage(tableVersion), "text", index)
        .then(($newPageNo) => expect(Number($newPageNo)).to.eq(curPageNo + 1));
    }
  }

  public NavigateToPreviousPage_List(
    tableVersion: "v1" | "v2" = "v1",
    index = 0,
  ) {
    let curPageNo: number;
    this.agHelper
      .GetText(this._listActivePage(tableVersion), "text", index)
      .then(($currentPageNo) => (curPageNo = Number($currentPageNo)));
    this.agHelper.GetNClick(this._liPreviousPage, index);
    this.agHelper.Sleep(1000);
    this.agHelper
      .GetText(this._listActivePage(tableVersion), "text", index)
      .then(($newPageNo) => expect(Number($newPageNo)).to.eq(curPageNo - 1));
    //}
  }

  public AssertPageNumber_List(
    pageNo: number,
    checkNoNextPage = false,
    tableVersion: "v1" | "v2" = "v1",
  ) {
    if (tableVersion == "v1") {
      cy.xpath(this._liCurrentSelectedPage)
        .invoke("text")
        .then(($currentPageNo) => expect(Number($currentPageNo)).to.eq(pageNo));

      if (pageNo == 1)
        this.agHelper.AssertAttribute(
          this._liPreviousPage,
          "aria-disabled",
          "true",
        );
      if (checkNoNextPage)
        this.agHelper.AssertAttribute(
          this._listNextPage,
          "aria-disabled",
          "true",
        );
      else
        this.agHelper.AssertAttribute(
          this._listNextPage,
          "aria-disabled",
          "false",
        );
    } else if (tableVersion == "v2") {
      this.agHelper
        .GetText(this._listActivePage(tableVersion), "text")
        .then(($currentPageNo) => expect(Number($currentPageNo)).to.eq(pageNo));

      if (pageNo == 1)
        this.agHelper
          .GetElement(this._listPreviousPage)
          .should("have.class", "rc-pagination-disabled");

      if (checkNoNextPage)
        this.agHelper
          .GetElement(this._listNextPage)
          .should("have.class", "rc-pagination-disabled");
      else
        this.agHelper
          .GetElement(this._listNextPage)
          .should("not.have.class", "rc-pagination-disabled");
    }
  }

  public AddSampleTableData() {
    this.propPane.EnterJSContext("Table data", JSON.stringify(sampleTableData));
    this.ChangeColumnType("action", "Button", "v2");
  }

  public SortColumn(columnName: string, direction: string) {
    this.agHelper.GetNClick(
      this._tableColumnHeaderMenuTrigger(columnName),
      0,
      true,
    );
    this.agHelper.GetNClickByContains(
      this._columnHeaderMenu,
      `Sort column ${direction}`,
    );
    this.agHelper.Sleep(500);
  }

  public AssertVisibleColumns(columnNames: string[]) {
    columnNames.forEach(($header) => {
      cy.xpath(this._columnHeader($header))
        .invoke("attr", "class")
        .then((classes) => {
          expect(classes).includes("draggable-header");
        });
    });
  }

  //This method is used to navigate forward using ">" button and backward "<"
  public NavigateToPageUsingButton_List(
    movement: string,
    pageNumber: number,
    version: "v1" | "v2" = "v2",
  ) {
    this.agHelper.GetNClick(this._listNavigation(movement), 0, true);
    this.agHelper.Sleep(2000);
    this.agHelper
      .GetText(this._listActivePage(version), "text")
      .then(($newPageNo) => expect(Number($newPageNo)).to.eq(pageNumber));
  }

  public NavigateToSpecificPage_List(
    pageNumber: number,
    version: "v1" | "v2" = "v2",
  ) {
    this.agHelper.GetNClick(`${this._paginationItem(pageNumber)}`);
    this.agHelper
      .GetText(this._listActivePage(version), "text")
      .then(($newPageNo) => expect(Number($newPageNo)).to.eq(pageNumber));
  }

  public DiscardEditRow(row: number, col: number, verify = true) {
    /*
     * Why not get it with text `Discard`?
     * We've tried using selector: `[data-colindex="${col}"][data-rowindex="${row}"] button span:contains('Discard')` and this dosn't work, making this spec fail.
     */
    const selector = `${this._tableRow(row, col, "v2")} button`;

    cy.get(selector).eq(1).should("be.enabled");
    this.agHelper.GetHoverNClick(selector, 1, true);
    verify && cy.get(selector).eq(1).should("be.disabled");
  }
}
