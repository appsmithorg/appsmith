/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable<Subject> {
    latestDeployPreview(): Chainable<void>;

    SignupFromAPI(uname: string, password: string);

    dragTo(subject: any, targetEl: any);

    downloadData(filetype: string);

    validateDownload(fileName: string);

    AddFilterWithOperator(
      operator: string,
      option: string,
      condition: string,
      value: string,
    );

    stubPostHeaderReq();

    addOAuth2ClientCredentialsDetails(
      accessTokenUrl: string,
      clientId: string,
      clientSecret: string,
      scope: string,
    );

    addOAuth2AuthorizationCodeDetails(
      accessTokenUrl: string,
      clientId: string,
      clientSecret: string,
      authURL: string,
    );

    testSelfSignedCertificateSettingsInREST(isOAuth2: boolean);

    addBasicProfileDetails(username: string, password: string);

    DeleteApp(appName: string);

    GetUrlQueryParams();

    LogOutUser();

    LoginUser(uname: string, pword: string, goToLoginPage?: boolean);

    LogintoApp(uname: string, pword: string);

    LogintoAppTestUser(uname: string, pword: string);

    Signup(uname: string, pword: string);

    LoginFromAPI(uname: string, pword: string);

    DeletepageFromSideBar();

    LogOut(toCheckgetPluginForm?: boolean);

    SearchApp(appname: string);

    WaitAutoSave();

    SelectAction(action: string);

    ClearSearch();

    paste($element: any, text: string);

    clickTest(testbutton: string);

    EvaluateCurrentValue(
      currentValue: string,
      isValueToBeEvaluatedDynamic?: boolean,
    );

    tabPopertyUpdate(tabId: string, newTabName: string);

    generateUUID();

    addDsl(dsl: any);

    DeleteAppByApi();

    DeleteWorkspaceByApi();

    togglebar(value: string);

    radiovalue(value: string, value2: string);

    optionValue(value: string, value2: string);

    typeIntoDraftEditor(selector: string, text: string);

    getPluginFormsAndCreateDatasource();

    NavigateToJSEditor();

    selectAction(option: string);

    deleteActionAndConfirm();

    deleteJSObject();

    deleteDataSource();

    dragAndDropToCanvas(widgetType: string, { x: number, y: number });

    dragAndDropToWidget(
      widgetType: string,
      destinationWidget: string,
      { x: number, y: number },
    );

    dragAndDropToWidgetBySelector(
      widgetType: string,
      destinationSelector: string,
      { x: number, y: number },
    );

    changeButtonColor(buttonColor: string);

    closePropertyPane();

    onClickActions(
      forSuccess: string,
      forFailure: string,
      actionType: string,
      actionValue: string,
      idx?: number,
    );

    isSelectRow(index: number);

    getDate(date: number, dateFormate: string);

    setDate(date: number, dateFormate: string);

    pageNo();

    pageNoValidate(index: number);

    validateDisableWidget(widgetCss: string, disableCss: string);

    validateToolbarVisible(widgetCss: string, toolbarCss: string);

    validateToolbarHidden(widgetCss: string, toolbarCss: string);

    validateEnableWidget(widgetCss: string, disableCss: string);

    validateHTMLText(widgetCss: string, htmlTag: string, value: string);

    setTinyMceContent(tinyMceId: string, content: string);

    startRoutesForDatasource();

    startServerAndRoutes();

    startErrorRoutes();

    NavigateToPaginationTab();

    ValidateTableData(value: string);

    ValidateTableV2Data(value: string);

    ValidatePublishTableData(value: string);

    ValidatePublishTableV2Data(value: string);

    ValidatePaginateResponseUrlData(runTestCss: string);

    ValidatePaginateResponseUrlDataV2(runTestCss: string);

    ValidatePaginationInputData(valueToTest: string);

    ValidatePaginationInputDataV2(valueToTest: string);

    CheckForPageSaveError();

    assertPageSave(validateSavedState?: boolean);

    validateCodeEditorContent(selector: string, contentToValidate: string);

    updateMapType(mapType: string);

    createJSObject(JSCode: string);

    createSuperUser();

    SignupFromAPI(uname: string, pword: string);

    startInterceptRoutesForMySQL();

    startInterceptRoutesForMongo();

    startInterceptRoutesForS3();

    replaceApplicationIdForInterceptPages(fixtureFile: string);

    paste(selector: string, pastePayload: string);

    typeValueNValidate(
      valueToType: string,
      fieldName?: string,
      isDynamic?: boolean,
    );

    checkCodeInputValue(selector: string);

    clickButton(btnVisibleText: string, toForceClick?: boolean);

    actionContextMenuByEntityName(
      entityNameinLeftSidebar: string,
      action?: string,
      subActions: string,
    );

    selectEntityByName(entityNameinLeftSidebar: string);

    EvaluatFieldValue(fieldName?: string, currentValue?: string);

    renameWithInPane(renameVal: string);

    getEntityName();

    VerifyErrorMsgAbsence(errorMsgToVerifyAbsence: string);

    VerifyErrorMsgPresence(errorMsgToVerifyAbsence: string);

    setQueryTimeout(timeout: string);

    VerifyNoDataDisplayAbsence();

    isNotInViewport(element: string);

    isInViewport(element: string);

    CheckAndUnfoldEntityItem(item: string);

    DeleteEntityStateLocalStorage();

    checkLabelForWidget(options: string);

    saveLocalStorageCache();

    restoreLocalStorageCache();

    StopContainer(path: string, containerName: string);

    StopAllContainer(path: string);

    StartContainer(path: string, containerName: string);

    StartNewContainer(
      url: string,
      path: string,
      version: string,
      containerName: string,
    );

    GetPath(path: string, containerName: string);

    GetCWD(path: string);

    GetAndVerifyLogs(path: string, containerName: string);

    typeTab();

    CreatePage();

    GenerateCRUD();

    AddPageFromTemplate();

    verifyCallCount(alias: string, expectedNumberOfCalls: number);

    RenameWidgetFromPropertyPane(
      widgetType: string,
      oldName: string,
      newName: string,
    );

    forceVisit(url: string);

    SelectDropDown(dropdownOption: string);

    RemoveMultiSelectItems(dropdownOptions: string[]);

    RemoveAllSelections();

    SelectFromMultiSelect(options: string);

    skipSignposting();

    stubPricingPage();

    validateEvaluatedValue(value: string);

    selectByTestId(value: string): Chainable<JQuery<HTMLElement>>;

    assertTooltipPresence(tooltipSelector: string, expectedText: string);

    matchImageSnapshot(
      name: string,
      options?: Partial<Cypress.ScreenshotOptions>,
    );

    fillGoogleFormPartly();

    fillGoogleForm();

    fillGithubFormPartly();

    fillGithubForm();

    openAuthentication();

    waitForServerRestart();


    initLocalstorage(): void;

    enterDatasourceAndPath(datasource: string, path: string): void;

    enterDatasource(datasource: string): void;

    ResponseStatusCheck(statusCode: number): void;

    ResponseCheck(): void;

    ResponseTextCheck(textTocheck: string): void;

    NavigateToAPI_Panel(): void;

    CreateAPI(apiname: string): void;

    EditApiNameFromExplorer(apiname: string): void;

    RunAPI(): void;

    SaveAndRunAPI(): void;

    validateRequest(apiName: string, baseurl: string, path: string, verb: string, error?: boolean): void;

    enterUrl(baseUrl: string, url: string, value: string): void;

    CreationOfUniqueAPIcheck(apiname: string): void;

    RenameEntity(value: string, selectFirst?: boolean): void;

    CreateApiAndValidateUniqueEntityName(apiname: string): void;

    validateMessage(value: string): void;

    DeleteWidgetFromSideBar(): void;

    DeleteAPI(): void;

    testCreateApiButton(): void;

    createAndFillApi(url: string, parameters: string): void;

    text(text: string): Chainable<Subject>;

    initLocalstorage(): void;

    NavigateToDatasourceEditor(): void;

    testDatasource(expectedRes?: boolean): void;

    saveDatasource(): void;

    testSaveDatasource(expectedRes?: boolean): void;

    fillPostgresDatasourceForm(shouldAddTrailingSpaces?: boolean): void;

    fillElasticDatasourceForm(shouldAddTrailingSpaces?: boolean): void;

    fillMySQLDatasourceForm(shouldAddTrailingSpaces?: boolean): void;

    fillMsSQLDatasourceForm(shouldAddTrailingSpaces?: boolean): void;

    fillArangoDBDatasourceForm(shouldAddTrailingSpaces?: boolean): void;

    fillRedshiftDatasourceForm(shouldAddTrailingSpaces?: boolean): void;

    fillSMTPDatasourceForm(shouldAddTrailingSpaces?: boolean): void;

    createPostgresDatasource(): void;

    createGoogleSheetsDatasource(): void;

    deleteDatasource(datasourceName: string): void;

    renameDatasource(datasourceName: string): void;

    fillAmazonS3DatasourceForm(): void;

    ReconnectDatasource(datasource: string): void;

    createNewAuthApiDatasource(renameVal: string): void;

    datasourceCardContainerStyle(tag: string): void;

    datasourceCardStyle(tag: string): void;

    datasourceImageStyle(tag: string): void;

    datasourceContentWrapperStyle(tag: string): void;

    datasourceIconWrapperStyle(tag: string): void;

    datasourceNameStyle(tag: string): void;

    mockDatasourceDescriptionStyle(tag: string): void;

    latestDeployPreview(): void;

    createGitBranch(branch: string): void;

    switchGitBranch(branch: string, expectError?: boolean): void;

    commitAndPush(assertFailure?: boolean): void;

    merge(destinationBranch: string): void;

    importAppFromGit(repo: string, assertConnectFailure?: boolean, failureMessage?: string): void;

    gitDiscardChanges(): void;

    regenerateSSHKey(repo: string, generateKey?: boolean, protocol?: string): void;

    initLocalstorage(): void;

    NavigateToDSGeneratePage(datasourceName: string): void;

    ClickGotIt(): void;

    fillAuthenticatedAPIForm(): void;

    runQuery(expectedRes?: boolean): void;

    onlyQueryRun(): void;

    hoverAndClick(entity: string): void;

    deleteQueryUsingContext(): void;

    runAndDeleteQuery(): void;

    executeDbQuery(queryName: string, eventName: string): void;

    ValidateQueryParams(param: { key: string; value: string }): void;

    TargetDropdownAndSelectOption(dropdownIdentifier: string, option: string, isDynamic?: boolean): void;

    VerifyCurrentDropdownOption(dropdownIdentifier: string, option: string): void;

    ValidateAndSelectDropdownOption(dropdownIdentifier: string, currentOption: string, newOption?: string, isDynamic?: boolean): void;

    borderMouseover(index: number, text: string): void;

    colorMouseover(index: number, text: string): void;

    validateColor(type: string, text: string): void;

    chooseColor(index: number, color: string): void;

    initLocalstorage(): void;

    changeZoomLevel(zoomValue: string): void;

    changeColumnType(dataType: string, doesPropertyTabExist?: boolean): void;

    switchToPaginationTab(): void;

    selectDateFormat(value: string): void;

    selectDropdownValue(element: string, value: string): void;

    assertDateFormat(): void;

    selectPaginationType(option: string): void;

    copyJSObjectToPage(pageName: string): void;

    AddActionWithModal(): void;

    createModal(ModalName: string, property: string): void;

    selectOnClickOption(option: string): void;

    selectWidgetOnClickOption(option: string): void;

    CheckWidgetProperties(checkboxCss: string): void;

    UncheckWidgetProperties(checkboxCss: string): void;

    EditWidgetPropertiesUsingJS(checkboxCss: string, inputJS: string): void;

    ChangeTextStyle(dropDownValue: string, textStylecss: string, labelName: string): void;

    widgetText(text: string, inputcss: string, innercss: string): void;

    verifyUpdatedWidgetName(text: string, txtToVerify?: string): void;

    verifyWidgetText(text: string, inputcss: string, innercss: string): void;

    editColName(text: string): void;

    invalidWidgetText(): void;

    EvaluateDataType(dataType: string): void;

    getCodeMirror(): Chainable<JQuery<HTMLElement>>;

    testCodeMirror(value: string): void;

    updateComputedValue(value: string): void;

    clearComputedValueFirst(): void;

    updateComputedValueV2(value: string): void;

    testCodeMirrorWithIndex(value: string, index: number): void;

    testCodeMirrorLast(value: string): void;

    testJsontext(endp: string, value: string, paste?: boolean): void;

    testJsontextclear(endp: string): void;

    testJsonTextClearMultiline(endp: string): void;

    getCodeInput($selector: string, value: string): JQuery<HTMLElement>;

    updateCodeInput($selector: string, value: string): void;

    focusCodeInput($selector: string, cursor?: { ch: number; line: number }): void;

    assertCursorOnCodeInput($selector: string, cursor?: { ch: number; line: number }): void;

    assertSoftFocusOnCodeInput($selector: string, cursor?: { ch: number; line: number }): void;

    selectColor(GivenProperty: string, colorOffset?: number): void;

    toggleJsAndUpdate(endp: string, value: string): void;

    toggleJsAndUpdateWithIndex(endp: string, value: string, index: number): void;

    assertControlVisibility(endp: string): void;

    tableColumnDataValidation(columnName: string): void;

    tableV2ColumnDataValidation(columnName: string): void;

    tableColumnPopertyUpdate(colId: string, newColName: string): void;

    tableV2ColumnPopertyUpdate(colId: string, newColName: string): void;

    backFromPropertyPanel(): void;

    hideColumn(colId: string): void;

    showColumn(colId: string): void;

    deleteColumn(colId: string): void;

    openFieldConfiguration(fieldIdentifier: string, shouldClosePanel?: boolean): void;

    deleteJSONFormField(fieldIdentifier: string): void;

    makeColumnVisible(colId: string): void;

    addColumn(colId: string): void;

    addColumnV2(colId: string): void;

    editColumn(colId: string, shouldReturnToMainPane?: boolean): void;

    readTextDataValidateCSS(cssProperty: string, cssValue: string): void;

    evaluateErrorMessage(value: string): void;

    addAction(value: string, property: string): void;

    selectResetWidget(eventName: string): void;

    selectWidgetForReset(value: string): void;

    SetDateToToday(): void;

    enterActionValue(value: string, property?: string): void;

    enterEventValue(value: string): void;

    enterNavigatePageName(value: string): void;

    Createpage(pageName: string, navigateToCanvasPage?: boolean): void;

    dropdownDynamic(text: string): void;

    dropdownMultiSelectDynamic(text: string): void;

    treeSelectDropdown(text: string): void;

    treeMultiSelectDropdown(text: string): void;

    dropdownDynamicUpdated(text: string): void;

    selectTextSize(text: string): void;

    selectTxtSize(text: string): void;

    getAlert(eventName: string, value?: string): void;

    addQueryFromLightningMenu(QueryName: string): void;

    addAPIFromLightningMenu(ApiName: string, eventName?: string): void;

    radioInput(index: number, text: string): void;

    tabVerify(index: number, text: string): void;

    openPropertyPane(widgetType: string): void;

    openPropertyPaneFromModal(widgetType: string): void;

    openPropertyPaneByWidgetName(widgetName: string, widgetType: string): void;

    openPropertyPaneCopy(widgetType: string): void;

    copyWidget(widget: string, widgetLocator: string): void;

    deleteWidget(): void;

    UpdateChartType(typeOfChart: string): void;

    alertValidate(text: string): void;

    ExportVerify(togglecss: string, name: string): void;

    getTableDataSelector(rowNum: number, colNum: number): string;

    getTableV2DataSelector(rowNum: number, colNum: number): string;

    readTabledata(rowNum: number, colNum: number): string;

    readTableV2data(rowNum: number, colNum: number): string;

    readTabledataPublish(rowNum: number, colNum: number, shouldNotGoOneLeveDeeper?: boolean): string;

    readTableV2dataPublish(rowNum: number, colNum: number): string;

    readTabledataValidateCSS(rowNum: number, colNum: number, cssProperty: string, cssValue: string, shouldNotGotOneLeveDeeper?: boolean): string;

    readTableV2dataValidateCSS(rowNum: number, colNum: number, cssProperty: string, cssValue: string): string;

    readTabledataFromSpecificIndex(rowNum: number, colNum: number, index: number): string;

    readTableV2dataFromSpecificIndex(rowNum: number, colNum: number, index: number): string;

    tablefirstdataRow(): string;

    scrollTabledataPublish(rowNum: number, colNum: number): void;

    readTableLinkPublish(rowNum: number, colNum: number): string;

    readTableV2LinkPublish(rowNum: number, colNum: number): string;

    assertEvaluatedValuePopup(expectedType: string): void;

    validateToastMessage(value: string): void;

    validateWidgetExists(selector: string): void;

    clearPropertyValue(value: string): void;

    validateNSelectDropdown(ddTitle: string, currentValue: string, newValue: string): void;

    EnableAllCodeEditors(): void;

    getTableCellHeight(x: number, y: number): string;

    hoverTableCell(x: number, y: number): void;

    editTableCell(x: number, y: number): void;

    editTableSelectCell(x: number, y: number): void;

    enterTableCellValue(x: number, y: number, text: string): void;

    discardTableCellValue(x: number, y: number): void;

    saveTableCellValue(x: number, y: number): void;

    saveTableRow(x: number, y: number): void;

    AssertTableRowSavable(x: number, y: number): void;

    discardTableRow(x: number, y: number): void;

    moveToStyleTab(): void;

    moveToContentTab(): void;

    openPropertyPaneWithIndex(widgetType: string, index: number): void;

    changeLayoutHeight(locator: string): void;

    changeLayoutHeightWithoutWait(locator: string): void;

    checkMinDefaultValue(endp: string, value: string): void;

    checkMaxDefaultValue(endp: string, value: string): void;

    freezeColumnFromDropdown(columnName: string, direction: string): void;

    sortColumn(columnName: string, direction: string): void;

    checkIfColumnIsFrozenViaCSS(rowNum: number, coumnNum: number, position?: string): void;

    checkColumnPosition(columnName: string, expectedColumnPosition: number): void;

    readLocalColumnOrder(columnOrderKey: string): any;

    checkLocalColumnOrder(expectedOrder: any[], direction: string, columnOrderKey?: string): void;

    findAndExpandEvaluatedTypeTitle(): void;

    dragAndDropColumn(sourceColumn: string, targetColumn: string): void;

    resizeColumn(columnName: string, resizeAmount: number): void;

    createWorkspace(): void;

    openWorkspaceOptionsPopup(workspaceName: string): void;

    enablePublicAccess(editMode?: boolean): void;

    launchApp(): void;

    AppSetupForRename(): void;

    CreateAppForWorkspace(workspaceName: string, appname: string): void;

    CreateNewAppInNewWorkspace(): void;
  }
}
