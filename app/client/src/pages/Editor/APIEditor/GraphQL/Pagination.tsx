import React, { useEffect, useState } from "react";
import styled from "constants/DefaultTheme";
import { change, formValueSelector } from "redux-form";
import FormRow from "components/editorComponents/FormRow";
import { PaginationType } from "entities/Action";
import RadioFieldGroup from "components/editorComponents/form/fields/RadioGroupField";
import {
  Text,
  TextType,
  TooltipComponent as Tooltip,
  Dropdown,
  Checkbox,
  DropdownOption,
} from "design-system";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { AnyAction, bindActionCreators, Dispatch } from "redux";
import { connect } from "react-redux";
import { AppState } from "@appsmith/reducers";
import { FormLabel } from "components/editorComponents/form/fields/StyledFormComponents";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import { Colors } from "constants/Colors";
import { GRAPHQL_PAGINATION_TYPE } from "constants/ApiEditorConstants/GraphQLEditorConstants";
import {
  LIMITBASED_PREFIX,
  CURSORBASED_PREFIX,
  CURSOR_PREVIOUS_PREFIX,
  CURSOR_NEXT_PREFIX,
} from "utils/editor/EditorBindingPaths";
import { log } from "loglevel";
import { PaginationSubComponent } from "components/formControls/utils";

const PAGINATION_PREFIX =
  "actionConfiguration.pluginSpecifiedTemplates[2].value";
interface PaginationProps {
  actionName: string;
  onTestClick: (test?: "PREV" | "NEXT") => void;
  paginationType: PaginationType;
  theme?: EditorTheme;
  query: string;
  formName: string;
  change: (formName: string, id: string, value: any) => void;
  cursorBased?: any;
  limitBased?: any;
}

const SubHeading = styled(Text)`
  display: block;
  margin-bottom: ${(props) => props.theme.spaces[4]}px;
  color: ${(props) => props.theme.colors.apiPane.pagination.stepTitle};
`;

const PaginationTypeView = styled.div`
  margin: -16px 0 24px 28px;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const PaginationContainer = styled.div`
  display: flex;
  width: 100%;
  padding: ${(props) => props.theme.spaces[8]}px
    ${(props) => props.theme.spaces[12]}px;
`;

const PaginationSection = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: ${(props) => props.theme.spaces[11]}px;
`;

const PaginationFieldWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 48%;
  max-width: 280px;
`;

const PaginationFieldContainer = styled.div`
  display: flex;
  flex-direction: row;
  &:not(:last-child) {
    margin-bottom: ${(props) => props.theme.spaces[9]}px;
  }
  ${PaginationFieldWrapper}:last-child {
    margin-left: 24px;
  }
`;

const Step = styled.div`
  label {
    width: fit-content;
    min-width: unset;
  }

  & label .bp3-popover-target .label-icon-wrapper {
    border-bottom: 1px dashed ${Colors.LIGHT_GREYISH_BLUE};
    cursor: help;
  }
`;

const CheckboxFieldWrapper = styled.div`
  margin-top: 8px;
  div > span {
    font-size: ${(props) => props.theme.fontSizes[2]}px;
  }
`;

const RadioFieldGroupWrapper = styled(RadioFieldGroup)`
  width: 80%;
  label {
    width: fit-content;
  }
`;

const DynamicTextFieldWrapper = styled(DynamicTextField)`
  &&&& .CodeMirror {
    background-color: ${(props) => props.disabled && "#eef2f5"};
  }
`;

const graphqlParseVariables = (queryBody: string) => {
  const variables: any = {};
  try {
    const variableString = queryBody.match(/\((\$[^)]*?)\)/);
    if (variableString && variableString?.length >= 2) {
      variableString[1].split(",").forEach((variableWithType: string) => {
        let [name = "", vtype = ""] = variableWithType.trim().split(":");
        name = name.trim().substring(1);
        vtype = vtype.trim();
        if (name.length > 0 && vtype.length > 0) {
          variables[name] = {
            name,
            type: vtype,
          };
        }
      });
    }
  } catch (error) {
    log(error);
  }

  return variables;
};

type PaginationTypeBasedWrapperProps = {
  actionName: string;
  className: string;
  dataReplayId: string;
  onInputChange?: (value: any) => void;
  onSelectVariable: (_: any, dropdownOption: any) => void;
  onSeparateKeyChange?: (value: any) => void;
  selectedVariable: {
    label?: string;
    value?: string;
  };
  separateKeyFlag?: boolean;
  separateKeyLabel?: string;
  separateKeyPath?: string;
  // This states that is separate value for any text is enabled or not
  separateValueFlag?: boolean;
  valuePath: string;
  valuePlaceholder?: string;
  valueLabel: string;
  variableOptions: Array<any>;
  variableLabel: string;
  variableTooltip?: string;
  valueTooltip?: string;
};

function PaginationTypeBasedWrapper({
  actionName,
  className,
  dataReplayId,
  onInputChange,
  onSelectVariable,
  onSeparateKeyChange,
  selectedVariable,
  separateKeyFlag,
  separateKeyLabel,
  separateKeyPath,
  separateValueFlag,
  valueLabel,
  valuePath,
  valuePlaceholder,
  valueTooltip,
  variableLabel,
  variableOptions,
  variableTooltip,
}: PaginationTypeBasedWrapperProps) {
  // Add a disabled option if there are no variables in the dropdown to select.
  const dropdownOptions: DropdownOption[] =
    variableOptions.length > 0
      ? variableOptions
      : [
          {
            label:
              "No such variable exists in the query. Please click on the dropdown to select one of the variables defined in the query",
            value: "",
            disabled: true,
            disabledTooltipText: true,
          },
        ];

  // creating a datatree path for the evaluated value
  const dataTreePath = `${actionName}.config.${valuePath
    .split(".")
    .slice(1)
    .join(".")}`;
  return (
    <PaginationFieldContainer>
      <PaginationFieldWrapper data-replay-id={dataReplayId}>
        <Step>
          <FormLabel>
            {variableTooltip ? (
              <Tooltip content={variableTooltip} hoverOpenDelay={500}>
                <span className="label-icon-wrapper">{variableLabel}</span>
              </Tooltip>
            ) : (
              <span className="label-icon-wrapper">{variableLabel}</span>
            )}
          </FormLabel>
        </Step>
        <Dropdown
          boundary="viewport"
          className={`${className}Variable`}
          dropdownMaxHeight={"200px"}
          errorMsg={
            !selectedVariable.value ||
            dropdownOptions.some(
              (option: DropdownOption) =>
                option.value === selectedVariable.value,
            )
              ? undefined
              : "No such variable exist in query"
          }
          fillOptions
          onSelect={onSelectVariable}
          options={dropdownOptions}
          placeholder={
            dropdownOptions.length > 0
              ? "Select a variable"
              : "Add variables in query to select here"
          }
          selected={
            (selectedVariable.label && selectedVariable.value
              ? selectedVariable
              : undefined) as any
          }
          showEmptyOptions
          showLabelOnly
          width={"100%"}
        />
      </PaginationFieldWrapper>
      <PaginationFieldWrapper data-replay-id={dataReplayId}>
        <Step>
          <FormLabel>
            {valueTooltip ? (
              <Tooltip content={valueTooltip} hoverOpenDelay={500}>
                <span className="label-icon-wrapper">{valueLabel}</span>
              </Tooltip>
            ) : (
              <span className="label-icon-wrapper">{valueLabel}</span>
            )}
          </FormLabel>
        </Step>
        <DynamicTextFieldWrapper
          className={`${className}Value`}
          dataTreePath={dataTreePath}
          disabled={separateKeyFlag && !separateValueFlag}
          name={valuePath}
          onChange={onInputChange}
          placeholder={valuePlaceholder || ""}
          showLightningMenu={!(separateKeyFlag && !separateValueFlag)}
        />
        {separateKeyFlag &&
          separateKeyPath &&
          separateKeyLabel &&
          onSeparateKeyChange && (
            <CheckboxFieldWrapper>
              <Checkbox
                fill
                isDefaultChecked={separateValueFlag}
                label={separateKeyLabel}
                name={separateKeyPath}
                onCheckChange={onSeparateKeyChange}
              />
            </CheckboxFieldWrapper>
          )}
      </PaginationFieldWrapper>
    </PaginationFieldContainer>
  );
}

function Pagination(props: PaginationProps) {
  const [variablesList, setVariablesList] = useState<any>(
    graphqlParseVariables(props.query),
  );

  useEffect(() => {
    setVariablesList(graphqlParseVariables(props.query));
  }, [props.query]);

  const variableOptions = Object.keys(variablesList).map((variable: any) => ({
    label: variable,
    value: variable,
  }));

  const setPaginationValue = (keyPath: string, key: string, value: any) => {
    props.change(
      props.formName,
      `${PAGINATION_PREFIX}.${keyPath}.${key}`,
      value,
    );
  };

  const setSeparateOrSameLimitValue = ({
    actualKeyPath,
    dependentKeyPath,
    isSeparateEnabled,
    value,
  }: {
    actualKeyPath: string;
    dependentKeyPath: string;
    isSeparateEnabled: boolean;
    value: any;
  }) => {
    if (!isSeparateEnabled) {
      props.change(
        props.formName,
        `${PAGINATION_PREFIX}.${dependentKeyPath}`,
        value,
      );
    }

    props.change(
      props.formName,
      `${PAGINATION_PREFIX}.${actualKeyPath}`,
      value,
    );
  };

  const paginationPrev = props.cursorBased?.previous;
  const paginationNext = props.cursorBased?.next;

  return (
    <PaginationContainer>
      <FormRow style={{ flexGrow: 1 }}>
        <RadioFieldGroupWrapper
          className="t--apiFormPaginationType"
          name="actionConfiguration.paginationType"
          options={[
            {
              label: "None",
              value: PaginationType.NONE,
            },
            {
              label: "Paginate via Limit and Offset",
              value: PaginationType.PAGE_NO,
            },
            {
              label: "Paginate via Cursor based",
              value: PaginationType.CURSOR,
            },
          ]}
          placeholder="Method"
          rows={3}
          selectedOptionElements={[
            null,
            <PaginationTypeView key={`${PaginationType.PAGE_NO}-element`}>
              <Text type={TextType.P1}>
                Specify a specific limit (number of results) and offset (the
                number of records that needed to be skipped).
              </Text>
              <PaginationSection>
                {/* Limit */}
                <PaginationTypeBasedWrapper
                  actionName={props.actionName}
                  className="t--apiFormPaginationLimit"
                  dataReplayId={btoa(
                    `${PAGINATION_PREFIX}.${LIMITBASED_PREFIX}.${PaginationSubComponent.Limit}`,
                  )}
                  onInputChange={(value: any) => {
                    setPaginationValue(
                      `${LIMITBASED_PREFIX}.${PaginationSubComponent.Limit}`,
                      "value",
                      value,
                    );
                  }}
                  onSelectVariable={(_: any, dropdownOption: any) => {
                    const values = variablesList[dropdownOption.value];
                    Object.keys(values).forEach((key: string) => {
                      setPaginationValue(
                        `${LIMITBASED_PREFIX}.${PaginationSubComponent.Limit}`,
                        key,
                        values[key],
                      );
                    });
                  }}
                  selectedVariable={{
                    label: props.limitBased?.limit?.name,
                    value: props.limitBased?.limit?.name,
                  }}
                  valueLabel="Limit Value"
                  valuePath={`${PAGINATION_PREFIX}.${LIMITBASED_PREFIX}.${PaginationSubComponent.Limit}.value`}
                  valuePlaceholder="{{Table1.pageSize}}"
                  valueTooltip="Override the value of the limit variable selected i.e. the no of rows returned"
                  variableLabel="Limit Variable"
                  variableOptions={variableOptions}
                  variableTooltip="Select the limit variable from the query"
                />
                {/* Offset */}
                <PaginationTypeBasedWrapper
                  actionName={props.actionName}
                  className="t--apiFormPaginationOffset"
                  dataReplayId={btoa(
                    `${PAGINATION_PREFIX}.${LIMITBASED_PREFIX}.${PaginationSubComponent.Offset}`,
                  )}
                  onInputChange={(value: any) => {
                    setPaginationValue(
                      `${LIMITBASED_PREFIX}.${PaginationSubComponent.Offset}`,
                      "value",
                      value,
                    );
                  }}
                  onSelectVariable={(_: any, dropdownOption: any) => {
                    const values = variablesList[dropdownOption.value];
                    Object.keys(values).forEach((key: string) => {
                      setPaginationValue(
                        `${LIMITBASED_PREFIX}.${PaginationSubComponent.Offset}`,
                        key,
                        values[key],
                      );
                    });
                  }}
                  selectedVariable={{
                    label: props.limitBased?.offset?.name,
                    value: props.limitBased?.offset?.name,
                  }}
                  valueLabel="Offset Value"
                  valuePath={`${PAGINATION_PREFIX}.${LIMITBASED_PREFIX}.${PaginationSubComponent.Offset}.value`}
                  valuePlaceholder="{{Table1.pageNo * Table1.pageSize}}"
                  valueTooltip="Override the value of the offset variable selected ie the no of rows omitted from the beginning"
                  variableLabel="Offset Variable"
                  variableOptions={variableOptions}
                  variableTooltip="Select the offset variable from the query"
                />
              </PaginationSection>
            </PaginationTypeView>,
            <PaginationTypeView key={`${PaginationType.CURSOR}-element`}>
              <Text type={TextType.P1}>
                Specfiy the previous and next cursor variables along with a
                limit value.{" "}
                <a
                  href="https://graphql.org/learn/pagination/"
                  rel="noreferrer"
                  style={{ textDecoration: "underline" }}
                  target={"_blank"}
                >
                  Refer documentation
                </a>{" "}
                for more information
              </Text>
              <PaginationSection>
                <SubHeading type={TextType.P1}>
                  Configure Previous Page
                </SubHeading>
                {/* Previous Limit Value */}
                <PaginationTypeBasedWrapper
                  actionName={props.actionName}
                  className="t--apiFormPaginationPrevLimit"
                  dataReplayId={btoa(
                    `${PAGINATION_PREFIX}.${CURSORBASED_PREFIX}.${CURSOR_PREVIOUS_PREFIX}`,
                  )}
                  onInputChange={(value: any) => {
                    setSeparateOrSameLimitValue({
                      actualKeyPath: `${CURSORBASED_PREFIX}.${CURSOR_PREVIOUS_PREFIX}.${PaginationSubComponent.Limit}.value`,
                      dependentKeyPath: `${CURSORBASED_PREFIX}.${CURSOR_NEXT_PREFIX}.${PaginationSubComponent.Limit}.value`,
                      value: value,
                      isSeparateEnabled: !!paginationNext?.limit?.isSeparate,
                    });
                  }}
                  onSelectVariable={(_: any, dropdownOption: any) => {
                    const values = variablesList[dropdownOption.value];
                    Object.keys(values).forEach((key: string) => {
                      setPaginationValue(
                        `${CURSORBASED_PREFIX}.${CURSOR_PREVIOUS_PREFIX}.${PaginationSubComponent.Limit}`,
                        key,
                        values[key],
                      );
                    });
                  }}
                  selectedVariable={{
                    label: paginationPrev?.limit?.name,
                    value: paginationPrev?.limit?.name,
                  }}
                  valueLabel="Limit Variable Value"
                  valuePath={`${PAGINATION_PREFIX}.${CURSORBASED_PREFIX}.${CURSOR_PREVIOUS_PREFIX}.${PaginationSubComponent.Limit}.value`}
                  valuePlaceholder="{{Table1.pageSize}}"
                  valueTooltip="Override the value for the previous no of rows to be fetched"
                  variableLabel="Limit Variable Name"
                  variableOptions={variableOptions}
                  variableTooltip="Select the variable from the query that holds the last/previous limit value"
                />
                {/* Previous Cursor Values */}
                <PaginationTypeBasedWrapper
                  actionName={props.actionName}
                  className="t--apiFormPaginationPrevCursor"
                  dataReplayId={btoa(
                    `${PAGINATION_PREFIX}.${CURSORBASED_PREFIX}.${CURSOR_PREVIOUS_PREFIX}.${PaginationSubComponent.Cursor}`,
                  )}
                  onInputChange={(value: any) => {
                    setPaginationValue(
                      `${CURSORBASED_PREFIX}.${CURSOR_PREVIOUS_PREFIX}.${PaginationSubComponent.Cursor}`,
                      "value",
                      value,
                    );
                  }}
                  onSelectVariable={(_: any, dropdownOption: any) => {
                    const values = variablesList[dropdownOption.value];
                    Object.keys(values).forEach((key: string) => {
                      setPaginationValue(
                        `${CURSORBASED_PREFIX}.${CURSOR_PREVIOUS_PREFIX}.${PaginationSubComponent.Cursor}`,
                        key,
                        values[key],
                      );
                    });
                  }}
                  selectedVariable={{
                    label: paginationPrev?.cursor?.name,
                    value: paginationPrev?.cursor?.name,
                  }}
                  valueLabel="Start Cursor Value"
                  valuePath={`${PAGINATION_PREFIX}.${CURSORBASED_PREFIX}.${CURSOR_PREVIOUS_PREFIX}.${PaginationSubComponent.Cursor}.value`}
                  valuePlaceholder="{{Api1.data.previousCursor}}"
                  valueTooltip="Binding the widget action to the previous page activity"
                  variableLabel="Start Cursor Variable"
                  variableOptions={variableOptions}
                  variableTooltip="Select the variable which holds the before cursor"
                />
              </PaginationSection>
              <PaginationSection>
                <SubHeading type={TextType.P1}>Configure Next Page</SubHeading>
                {/* Next Limit Value */}
                <PaginationTypeBasedWrapper
                  actionName={props.actionName}
                  className="t--apiFormPaginationNextLimit"
                  dataReplayId={btoa(
                    `${PAGINATION_PREFIX}.${CURSOR_NEXT_PREFIX}.${PaginationSubComponent.Limit}`,
                  )}
                  onInputChange={(value: any) => {
                    setPaginationValue(
                      `${CURSORBASED_PREFIX}.${CURSOR_NEXT_PREFIX}.${PaginationSubComponent.Limit}`,
                      "value",
                      value,
                    );
                  }}
                  onSelectVariable={(_: any, dropdownOption: any) => {
                    const values = variablesList[dropdownOption.value];
                    Object.keys(values).forEach((key: string) => {
                      setPaginationValue(
                        `${CURSORBASED_PREFIX}.${CURSOR_NEXT_PREFIX}.${PaginationSubComponent.Limit}`,
                        key,
                        values[key],
                      );
                    });
                  }}
                  onSeparateKeyChange={(value: any) => {
                    setPaginationValue(
                      `${CURSORBASED_PREFIX}.${CURSOR_NEXT_PREFIX}.${PaginationSubComponent.Limit}`,
                      "isSeparate",
                      value,
                    );
                  }}
                  selectedVariable={{
                    label: paginationNext?.limit?.name,
                    value: paginationNext?.limit?.name,
                  }}
                  separateKeyFlag
                  separateKeyLabel="Enable separate value for first limit variable"
                  separateKeyPath={`${PAGINATION_PREFIX}.${CURSORBASED_PREFIX}.${CURSOR_NEXT_PREFIX}.${PaginationSubComponent.Limit}.isSeparate`}
                  separateValueFlag={!!paginationNext?.limit?.isSeparate}
                  valueLabel="Limit Variable Value"
                  valuePath={`${PAGINATION_PREFIX}.${CURSORBASED_PREFIX}.${CURSOR_NEXT_PREFIX}.${PaginationSubComponent.Limit}.value`}
                  valuePlaceholder="{{Table1.pageSize}}"
                  valueTooltip="Override the value for the next no of rows to be fetched"
                  variableLabel="Limit Variable Name"
                  variableOptions={variableOptions}
                  variableTooltip="Select the variable from the query that holds the first/next limit value"
                />
                {/* Next Cursor Values */}
                <PaginationTypeBasedWrapper
                  actionName={props.actionName}
                  className="t--apiFormPaginationNextCursor"
                  dataReplayId={btoa(
                    `${PAGINATION_PREFIX}.${CURSOR_NEXT_PREFIX}.${PaginationSubComponent.Cursor}`,
                  )}
                  onInputChange={(value: any) => {
                    setPaginationValue(
                      `${CURSORBASED_PREFIX}.${CURSOR_NEXT_PREFIX}.${PaginationSubComponent.Cursor}`,
                      "value",
                      value,
                    );
                  }}
                  onSelectVariable={(_: any, dropdownOption: any) => {
                    const values = variablesList[dropdownOption.value];
                    Object.keys(values).forEach((key: string) => {
                      setPaginationValue(
                        `${CURSORBASED_PREFIX}.${CURSOR_NEXT_PREFIX}.${PaginationSubComponent.Cursor}`,
                        key,
                        values[key],
                      );
                    });
                  }}
                  selectedVariable={{
                    label: paginationNext?.cursor?.name,
                    value: paginationNext?.cursor?.name,
                  }}
                  valueLabel="End Cursor Value"
                  valuePath={`${PAGINATION_PREFIX}.${CURSORBASED_PREFIX}.${CURSOR_NEXT_PREFIX}.${PaginationSubComponent.Cursor}.value`}
                  valuePlaceholder="{{Api1.data.nextCursor}}"
                  valueTooltip="Binding the widget action to the next page activity"
                  variableLabel="End Cursor Variable"
                  variableOptions={variableOptions}
                  variableTooltip="Select the variable which holds the after cursor"
                />
              </PaginationSection>
            </PaginationTypeView>,
          ]}
        />
      </FormRow>
    </PaginationContainer>
  );
}

const mapStateToProps = (state: AppState, props: { formName: string }) => {
  const selector = formValueSelector(props.formName);
  const pluginExtraData: GRAPHQL_PAGINATION_TYPE = selector(
    state,
    PAGINATION_PREFIX,
  );
  const limitBased = pluginExtraData?.[LIMITBASED_PREFIX];
  const cursorBased = pluginExtraData?.[CURSORBASED_PREFIX];

  return {
    cursorBased,
    limitBased,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<AnyAction>) => {
  return bindActionCreators({ change }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(Pagination);
