import React from "react";

function SQLForm() {
  return <div />;
}

export default SQLForm;

/*
 
        {selectedDatasource.value ? (
          <SelectWrapper width={DROPDOWN_DIMENSION.WIDTH}>
            <Label>
              Select {pluginField.TABLE} from{" "}
              <Bold>{selectedDatasource.label}</Bold>
            </Label>
            <Dropdown
              cypressSelector="t--table-dropdown"
              dropdownMaxHeight={"300px"}
              errorMsg={tableDropdownErrorMsg}
              height={DROPDOWN_DIMENSION.HEIGHT}
              isLoading={fetchingDatasourceConfigs}
              onSelect={onSelectTable}
              optionWidth={DROPDOWN_DIMENSION.WIDTH}
              options={datasourceTableOptions}
              selected={selectedTable}
              showLabelOnly
              width={DROPDOWN_DIMENSION.WIDTH}
            />
          </SelectWrapper>
        ) : null}
        {showEditDatasourceBtn && (
          <EditDatasourceButton
            category={Category.tertiary}
            onClick={goToEditDatasource}
            size={Size.medium}
            text="Edit Datasource"
            type="button"
          />
        )}
        {!isGoogleSheetPlugin ? (
          <>
            {showSearchableColumn && (
              <SelectWrapper width={DROPDOWN_DIMENSION.WIDTH}>
                <Row>
                  Select a searchable {pluginField.COLUMN} from the
                  selected&nbsp;
                  {pluginField.TABLE}
                  <TooltipWrapper>
                    <Tooltip
                      content="Only string values are allowed for searchable column"
                      hoverOpenDelay={200}
                    >
                      <RoundBg>
                        <Icon
                          fillColor={Colors.WHITE}
                          hoverFillColor={Colors.WHITE}
                          name="help"
                          size={IconSize.XXS}
                        />
                      </RoundBg>
                    </Tooltip>
                  </TooltipWrapper>
                </Row>
                <Dropdown
                  cypressSelector="t--searchColumn-dropdown"
                  disabled={selectedTableColumnOptions.length === 0}
                  dropdownMaxHeight={"300px"}
                  helperText={
                    selectedTableColumnOptions.length === 0
                      ? `* Optional (No searchable ${pluginField.COLUMN} to select)`
                      : "* Optional"
                  }
                  onSelect={onSelectColumn}
                  optionWidth={DROPDOWN_DIMENSION.WIDTH}
                  options={selectedTableColumnOptions}
                  selected={selectedColumn}
                  showLabelOnly
                  width={DROPDOWN_DIMENSION.WIDTH}
                />
              </SelectWrapper>
            )}
            <GeneratePageSubmitBtn
              disabled={submitButtonDisable}
              isLoading={!!isGeneratingTemplatePage}
              onSubmit={handleFormSubmit}
              showSubmitButton={!!showSubmitButton}
            />
          </>
        ) : (
          <GoogleSheetForm
            generatePageAction={generatePageAction}
            googleSheetPluginId={selectedDatasourcePluginId}
            renderSubmitButton={({
              disabled,
              isLoading,
              onSubmit,
            }: {
              onSubmit: () => void;
              disabled: boolean;
              isLoading: boolean;
            }) => (
              <GeneratePageSubmitBtn
                disabled={disabled}
                isLoading={!!isGeneratingTemplatePage || isLoading}
                onSubmit={onSubmit}
                showSubmitButton={!!showSubmitButton}
              />
            )}
            selectedDatasource={selectedDatasource}
            selectedSpreadsheet={selectedTable}
            sheetColumnsHeaderProps={sheetColumnsHeaderProps}
            sheetsListProps={sheetsListProps}
            spreadSheetsProps={spreadSheetsProps}
          />
        )}
      </FormWrapper>
*/
