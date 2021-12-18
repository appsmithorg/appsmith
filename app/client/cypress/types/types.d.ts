declare namespace Cypress {
    interface Chainable<Subject> {
        createOrg(): Chainable<any>
        renameOrg(orgName: any, newOrgName: any): Chainable<any>
        goToEditFromPublish(): Chainable<any>
        dragTo(prevSubject: any, subject: any, targetEl: any): Chainable<any>
        downloadData(filetype: any): Chainable<any>
        validateDownload(fileName: any): Chainable<any>
        AddFilterWithOperator(operator: any, option: any, condition: any, value: any): Chainable<any>
        navigateToOrgSettings(orgName: any): Chainable<any>
        openOrgOptionsPopup(orgName: any): Chainable<any>
        inviteUserForOrg(orgName: any, email: any, role: any): Chainable<any>
        CheckShareIcon(orgName: any, count: any): Chainable<any>
        stubPostHeaderReq(): Chainable<any>
        shareApp(email: any, role: any): Chainable<any>
        shareAndPublic(email: any, role: any): Chainable<any>
        enablePublicAccess(): Chainable<any>
        deleteUserFromOrg(orgName: any, email: any): Chainable<any>
        updateUserRoleForOrg(orgName: any, email: any, role: any): Chainable<any>
        launchApp(appName: any): Chainable<any>
        AppSetupForRename(): Chainable<any>
        CreateAppForOrg(orgName: any, appname: any): Chainable<any>
        CreateAppInFirstListedOrg(appname: any): Chainable<any>
        addOauthAuthDetails(accessTokenUrl: any, clientId: any, clientSecret: any, authURL: any): Chainable<any>
        addBasicProfileDetails(username: any, password: any): Chainable<any>
        firestoreDatasourceForm(): Chainable<any>
        amazonDatasourceForm(): Chainable<any>
        LogintoApp(uname: any, pword: any): Chainable<any>
        Signup(uname: any, pword: any): Chainable<any>
        LoginFromAPI(uname: any, pword: any): Chainable<any>
        DeletepageFromSideBar(): Chainable<any>
        LogOut(): Chainable<any>
        NavigateToHome(): Chainable<any>
        NavigateToWidgets(pageName: any): Chainable<any>
        SearchApp(appname: any): Chainable<any>
        SearchEntity(apiname1: any, apiname2: any): Chainable<any>
        GlobalSearchEntity(apiname1: any): Chainable<any>
        ResponseStatusCheck(statusCode: any): Chainable<any>
        ResponseCheck(textTocheck: any): Chainable<any>
        ResponseTextCheck(textTocheck: any): Chainable<any>
        NavigateToAPI_Panel(): Chainable<any>
        NavigateToEntityExplorer(): Chainable<any>
        CreateAPI(apiname: any): Chainable<any>
        CreateSubsequentAPI(apiname: any): Chainable<any>
        EditApiName(apiname: any): Chainable<any>
        EditApiNameFromExplorer(apiname: any): Chainable<any>
        EditEntityNameByDoubleClick(entityName: any, updatedName: any): Chainable<any>
        WaitAutoSave(): Chainable<any>
        RunAPI(): Chainable<any>
        SaveAndRunAPI(): Chainable<any>
        validateRequest(apiName: any, baseurl: any, path: any, verb: any, error?: boolean): Chainable<any>
        SelectAction(action: any): Chainable<any>
        ClearSearch(): Chainable<any>
        SearchEntityandOpen(apiname1: any): Chainable<any>
        SearchEntityAndUnfold(apiname1: any): Chainable<any>
        SearchEntityandDblClick(apiname1: any): Chainable<any>
        enterDatasourceAndPath(datasource: any, path: any): Chainable<any>
        enterDatasource(datasource: any): Chainable<any>
        changeZoomLevel(zoomValue: any): Chainable<any>
        changeColumnType(dataType: any): Chainable<any>
        EnterSourceDetailsWithHeader(baseUrl: any, v1method: any, hKey: any, hValue: any): Chainable<any>
        EditSourceDetail(baseUrl: any, v1method: any): Chainable<any>
        switchToPaginationTab(): Chainable<any>
        switchToAPIInputTab(): Chainable<any>
        selectDateFormat(value: any): Chainable<any>
        selectDropdownValue(element: any, value: any): Chainable<any>
        assertDateFormat(): Chainable<any>
        selectPaginationType(option: any): Chainable<any>
        clickTest(testbutton: any): Chainable<any>
        enterUrl(apiname: any, url: any, value: any): Chainable<any>
        EnterSourceDetailsWithQueryParam(baseUrl: any, v1method: any, hKey: any, hValue: any, qKey: any, qValue: any): Chainable<any>
        EnterSourceDetailsWithbody(baseUrl: any, v1method: any, hKey: any, hValue: any): Chainable<any>
        CreationOfUniqueAPIcheck(apiname: any): Chainable<any>
        MoveAPIToHome(apiname: any): Chainable<any>
        MoveAPIToPage(pageName: any): Chainable<any>
        copyEntityToPage(pageName: any): Chainable<any>
        CopyAPIToHome(): Chainable<any>
        RenameEntity(value: any): Chainable<any>
        CreateApiAndValidateUniqueEntityName(apiname: any): Chainable<any>
        validateMessage(value: any): Chainable<any>
        DeleteAPIFromSideBar(): Chainable<any>
        DeleteWidgetFromSideBar(): Chainable<any>
        deleteEntity(): Chainable<any>
        DeleteAPI(apiname: any): Chainable<any>
        copyJSObjectToPage(pageName: any): Chainable<any>
        AddActionWithModal(): Chainable<any>
        createModal(ModalName: any): Chainable<any>
        selectOnClickOption(option: any): Chainable<any>
        CheckWidgetProperties(checkboxCss: any): Chainable<any>
        UncheckWidgetProperties(checkboxCss: any): Chainable<any>
        EditWidgetPropertiesUsingJS(checkboxCss: any, inputJS: any): Chainable<any>
        ChangeTextStyle(dropDownValue: any, textStylecss: any, labelName: any): Chainable<any>
        widgetText(text: any, inputcss: any, innercss: any): Chainable<any>
        verifyWidgetText(text: any, inputcss: any, innercss: any): Chainable<any>
        editColName(text: any): Chainable<any>
        invalidWidgetText(): Chainable<any>
        EvaluateDataType(dataType: any): Chainable<any>
        EvaluateCurrentValue(currentValue: any): Chainable<any>
        PublishtheApp(): Chainable<any>
        getCodeMirror(): Chainable<any>
        testCodeMirror(value: any): Chainable<any>
        updateComputedValue(value: any): Chainable<any>
        testCodeMirrorLast(value: any): Chainable<any>
        testJsontext(endp: any, value: any, paste?: boolean): Chainable<any>
        updateCodeInput($selector: any, value: any): Chainable<any>
        selectColor(GivenProperty: any): Chainable<any>
        toggleJsAndUpdate(endp: any, value: any): Chainable<any>
        assertControlVisibility(endp: any, value: any): Chainable<any>
        tableColumnDataValidation(columnName: any): Chainable<any>
        tableColumnPopertyUpdate(colId: any, newColName: any): Chainable<any>
        hideColumn(colId: any): Chainable<any>
        showColumn(colId: any): Chainable<any>
        deleteColumn(colId: any): Chainable<any>
        makeColumnVisible(colId: any): Chainable<any>
        addColumn(colId: any): Chainable<any>
        editColumn(colId: any): Chainable<any>
        readTabledataValidateCSS(rowNum: any, colNum: any, cssProperty: any, cssValue: any): Chainable<any>
        readTextDataValidateCSS(cssProperty: any, cssValue: any): Chainable<any>
        evaluateErrorMessage(value: any): Chainable<any>
        addAction(value: any): Chainable<any>
        onTableAction(value: any, value1: any, value2: any): Chainable<any>
        selectShowMsg(): Chainable<any>
        addSuccessMessage(value: any): Chainable<any>
        SetDateToToday(): Chainable<any>
        enterActionValue(value: any): Chainable<any>
        enterNavigatePageName(value: any): Chainable<any>
        ClearDate(): Chainable<any>
        ClearDateFooter(): Chainable<any>
        DeleteModal(): Chainable<any>
        Createpage(Pagename: any): Chainable<any>
        Deletepage(Pagename: any): Chainable<any>
        generateUUID(): Chainable<any>
        addDsl(dsl: any): Chainable<any>
        DeleteAppByApi(): Chainable<any>
        radiovalue(value: any, value2: any): Chainable<any>
        optionValue(value: any, value2: any): Chainable<any>
        dropdownDynamic(text: any): Chainable<any>
        dropdownMultiSelectDynamic(text: any): Chainable<any>
        treeSelectDropdown(text: any): Chainable<any>
        treeMultiSelectDropdown(text: any): Chainable<any>
        dropdownDynamicUpdated(text: any): Chainable<any>
        selectTextSize(text: any): Chainable<any>
        togglebarDisable(value: any): Chainable<any>
        addQueryFromLightningMenu(QueryName: any): Chainable<any>
        addAPIFromLightningMenu(ApiName: any): Chainable<any>
        radioInput(index: any, text: any): Chainable<any>
        tabVerify(index: any, text: any): Chainable<any>
        getPluginFormsAndCreateDatasource(): Chainable<any>
        NavigateToApiEditor(): Chainable<any>
        NavigateToWidgetsInExplorer(): Chainable<any>
        NavigateToQueriesInExplorer(): Chainable<any>
        NavigateToJSEditor(): Chainable<any>
        testCreateApiButton(): Chainable<any>
        testSaveDeleteDatasource(): Chainable<any>
        importCurl(): Chainable<any>
        NavigateToDatasourceEditor(): Chainable<any>
        NavigateToQueryEditor(): Chainable<any>
        NavigateToActiveTab(): Chainable<any>
        NavigateToActiveDSQueryPane(datasourceName: any): Chainable<any>
        NavigateToDSGeneratePage(datasourceName: any): Chainable<any>
        ClickGotIt(): Chainable<any>
        testDatasource(expectedRes?: boolean): Chainable<any>
        saveDatasource(): Chainable<any>
        testSaveDatasource(expectedRes?: boolean): Chainable<any>
        fillGoogleSheetsDatasourceForm(): Chainable<any>
        fillMongoDatasourceForm(shouldAddTrailingSpaces?: boolean): Chainable<any>
        fillPostgresDatasourceForm(shouldAddTrailingSpaces?: boolean): Chainable<any>
        fillMySQLDatasourceForm(shouldAddTrailingSpaces?: boolean): Chainable<any>
        fillMsSQLDatasourceForm(shouldAddTrailingSpaces?: boolean): Chainable<any>
        fillArangoDBDatasourceForm(shouldAddTrailingSpaces?: boolean): Chainable<any>
        fillRedshiftDatasourceForm(shouldAddTrailingSpaces?: boolean): Chainable<any>
        fillUsersMockDatasourceForm(shouldAddTrailingSpaces?: boolean): Chainable<any>
        createPostgresDatasource(): Chainable<any>
        deleteDatasource(datasourceName: any): Chainable<any>
        runQuery(): Chainable<any>
        onlyQueryRun(): Chainable<any>
        hoverAndClick(): Chainable<any>
        deleteQuery(): Chainable<any>
        deleteJSObject(): Chainable<any>
        deleteDataSource(): Chainable<any>
        deleteQueryUsingContext(): Chainable<any>
        runAndDeleteQuery(): Chainable<any>
        dragAndDropToCanvas(widgetType: any, undefined: any): Chainable<any>
        dragAndDropToWidget(widgetType: any, destinationWidget: any, undefined: any): Chainable<any>
        executeDbQuery(queryName: any): Chainable<any>
        CreateMockQuery(queryName: any): Chainable<any>
        openPropertyPane(widgetType: any): Chainable<any>
        openPropertyPaneCopy(widgetType: any): Chainable<any>
        changeButtonColor(buttonColor: any): Chainable<any>
        closePropertyPane(): Chainable<any>
        onClickActions(forSuccess: any, forFailure: any, endp: any): Chainable<any>
        copyWidget(widget: any, widgetLocator: any): Chainable<any>
        deleteWidget(widget: any): Chainable<any>
        UpdateChartType(typeOfChart: any): Chainable<any>
        createAndFillApi(url: any, parameters: any): Chainable<any>
        isSelectRow(index: any): Chainable<any>
        devSpecialCommand(text: any, number: any): Chainable<any>
        readTabledata(rowNum: any, colNum: any): Chainable<any>
        getDate(date: any, dateFormate: any): Chainable<any>
        setDate(date: any, dateFormate: any): Chainable<any>
        pageNo(index: any): Chainable<any>
        pageNoValidate(index: any): Chainable<any>
        validateDisableWidget(widgetCss: any, disableCss: any): Chainable<any>
        validateToolbarVisible(widgetCss: any, toolbarCss: any): Chainable<any>
        validateToolbarHidden(widgetCss: any, toolbarCss: any): Chainable<any>
        validateEnableWidget(widgetCss: any, disableCss: any): Chainable<any>
        validateHTMLText(widgetCss: any, htmlTag: any, value: any): Chainable<any>
        startRoutesForDatasource(): Chainable<any>
        startServerAndRoutes(): Chainable<any>
        startErrorRoutes(): Chainable<any>
        alertValidate(text: any): Chainable<any>
        ExportVerify(togglecss: any, name: any): Chainable<any>
        getTableDataSelector(rowNum: any, colNum: any): Chainable<any>
        readTabledataPublish(rowNum: any, colNum: any): Chainable<any>
        scrollTabledataPublish(rowNum: any, colNum: any): Chainable<any>
        readTableLinkPublish(rowNum: any, colNum: any): Chainable<any>
        assertEvaluatedValuePopup(expectedType: any): Chainable<any>
        validateToastMessage(value: any): Chainable<any>
        NavigateToPaginationTab(): Chainable<any>
        ValidateTableData(value: any): Chainable<any>
        ValidatePublishTableData(value: any): Chainable<any>
        ValidatePaginateResponseUrlData(runTestCss: any): Chainable<any>
        ValidatePaginationInputData(): Chainable<any>
        callApi(apiname: any): Chainable<any>
        assertPageSave(): Chainable<any>
        ValidateQueryParams(param: any): Chainable<any>
        validateCodeEditorContent(selector: any, contentToValidate: any): Chainable<any>
        renameDatasource(datasourceName: any): Chainable<any>
        skipGenerateCRUDPage(): Chainable<any>
        fillAmazonS3DatasourceForm(): Chainable<any>
        createAmazonS3Datasource(): Chainable<any>
        createJSObject(JSCode: any): Chainable<any>
        createSuperUser(): Chainable<any>
        SignupFromAPI(uname: any, pword: any): Chainable<any>
        fillMongoDatasourceFormWithURI(): Chainable<any>
        startInterceptRoutesForMySQL(): Chainable<any>
        startInterceptRoutesForMongo(): Chainable<any>
        startInterceptRoutesForS3(): Chainable<any>
        replaceApplicationIdForInterceptPages(fixtureFile: any): Chainable<any>
        clearPropertyValue(value: any): Chainable<any>
        validateNSelectDropdown(ddTitle: any, currentValue: any, newValue: any): Chainable<any>
        typeValueNValidate(valueToType: any, fieldName?: string): Chainable<any>
        clickButton(btnVisibleText: any): Chainable<any>
        deleteEntitybyName(entityNameinLeftSidebar: any): Chainable<any>
        selectEntityByName(entityNameinLeftSidebar: any): Chainable<any>
        EvaluatFieldValue(fieldName?: string, currentValue?: string): Chainable<any>
        renameWithInPane(renameVal: any): Chainable<any>
        getEntityName(): Chainable<any>
        VerifyErrorMsgAbsence(errorMsgToVerifyAbsence: any): Chainable<any>
        setQueryTimeout(timeout: any): Chainable<any>
  }
}