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

    LoginFromAPI(uname: string, pword: string, redirectUrl?: string);

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

    updateCodeInput(selector: string, value: string);
  }
}
