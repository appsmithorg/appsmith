import React, { useEffect, useState } from "react";
import { parse, getOperationAST, OperationDefinitionNode } from "graphql";
import styled from "constants/DefaultTheme";
import { change, formValueSelector } from "redux-form";
import FormRow from "components/editorComponents/FormRow";
import { PaginationType } from "entities/Action";
import RadioFieldGroup from "components/editorComponents/form/fields/RadioGroupField";
import Text, { TextType } from "components/ads/Text";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { Maybe } from "graphql/jsutils/Maybe";
import { Dropdown, Checkbox } from "components/ads";
import { AnyAction, bindActionCreators, Dispatch } from "redux";
import { connect } from "react-redux";
import { AppState } from "reducers";
import log from "loglevel";
import Tooltip from "components/ads/Tooltip";
import { FormLabel } from "components/editorComponents/form/fields/StyledFormComponents";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";

interface PaginationProps {
  onTestClick: (test?: "PREV" | "NEXT") => void;
  paginationType: PaginationType;
  theme?: EditorTheme;
  query: string;
  formName: string;
  change: (formName: string, id: string, value: any) => void;
  cursorBased?: any;
  limitBased?: any;
}

const Description = styled(Text)`
  display: block;
  margin-bottom: ${(props) => props.theme.spaces[6]}px;
`;

const SubHeading = styled(Text)`
  display: block;
  margin-bottom: ${(props) => props.theme.spaces[8]}px;
  color: ${(props) => props.theme.colors.apiPane.pagination.stepTitle};
`;

const PaginationTypeView = styled.div`
  margin: -16px 0 16px 28px;
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
`;

const PaginationFieldContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const PaginationFieldWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: ${(props) => props.theme.spaces[5]}px;
  width: 48%;
`;

const Step = styled.div`
  label {
    width: fit-content;
    min-width: unset;
  }

  & label .bp3-popover-target .label-icon-wrapper {
    text-decoration: underline;
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

const PAGINATION_PREFIX = "actionConfiguration.selfReferencingData";
const LIMITBASED_PREFIX = "limitBased";
const CURSORBASED_PREFIX = "cursorBased";

const graphqlParseVariables = (queryBody: string) => {
  const variables: any = {};
  try {
    const document = parse(queryBody);
    const query: Maybe<OperationDefinitionNode> = getOperationAST(document);
    if (!!query && query.variableDefinitions) {
      for (const varDef of query.variableDefinitions) {
        if (varDef?.variable && varDef?.type) {
          variables[varDef.variable?.name?.value] = {
            name: varDef.variable?.name?.value,
            type: (varDef.type as any)?.name?.value,
          };
        }
      }
    }
  } catch (error) {
    log.error(error);
  }

  return variables;
};

type PaginationTypeBasedWrapperProps = {
  dataReplayId: string;
  onInputChange?: any;
  onSelectVariable: any;
  onSeparateKeyChange?: any;
  selectedVariable: any;
  separateKeyFlag?: boolean;
  separateKeyLabel?: string;
  separateKeyPath?: string;
  // This states that is separate value for any text is enabled or not
  separateValueFlag?: boolean;
  valueClassName: string;
  valuePath: string;
  valuePlaceholder?: string;
  valueText: string;
  variablesOptions: Array<any>;
  variableText: string;
  variableTooltip?: string;
  valueTooltip?: string;
};

function PaginationTypeBasedWrapper({
  dataReplayId,
  onInputChange,
  onSelectVariable,
  onSeparateKeyChange,
  selectedVariable,
  separateKeyFlag,
  separateKeyLabel,
  separateKeyPath,
  separateValueFlag,
  valueClassName,
  valuePath,
  valuePlaceholder,
  valueText,
  valueTooltip,
  variablesOptions,
  variableText,
  variableTooltip,
}: PaginationTypeBasedWrapperProps) {
  return (
    <PaginationFieldContainer>
      <PaginationFieldWrapper data-replay-id={dataReplayId}>
        <Step>
          <FormLabel>
            {variableTooltip ? (
              <Tooltip content={variableTooltip} hoverOpenDelay={500}>
                <span className="label-icon-wrapper">{variableText}</span>
              </Tooltip>
            ) : (
              <span className="label-icon-wrapper">{variableText}</span>
            )}
          </FormLabel>
        </Step>
        <Dropdown
          boundary="viewport"
          dropdownMaxHeight={"200px"}
          fillOptions
          onSelect={onSelectVariable}
          options={variablesOptions}
          selected={selectedVariable}
          showLabelOnly
          width={"100%"}
        />
      </PaginationFieldWrapper>
      <PaginationFieldWrapper data-replay-id={dataReplayId}>
        <Step>
          <FormLabel>
            {valueTooltip ? (
              <Tooltip content={valueTooltip} hoverOpenDelay={500}>
                <span className="label-icon-wrapper">{valueText}</span>
              </Tooltip>
            ) : (
              <span className="label-icon-wrapper">{valueText}</span>
            )}
          </FormLabel>
        </Step>
        <DynamicTextFieldWrapper
          className={valueClassName}
          disabled={separateKeyFlag && !separateValueFlag}
          fill={!!true}
          height="100%"
          name={`${PAGINATION_PREFIX}.${valuePath}`}
          onChange={onInputChange}
          placeholder={valuePlaceholder || ""}
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
                name={`${PAGINATION_PREFIX}.${separateKeyPath}`}
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

  const variablesOptions = Object.keys(variablesList).map((variable: any) => ({
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
              <PaginationSection>
                <Description type={TextType.P1}>
                  Specify a specific limit (number of results) and offset (the
                  number of records that needed to be skipped).
                </Description>
                {/* Limit */}
                <PaginationTypeBasedWrapper
                  dataReplayId={btoa(
                    `${PAGINATION_PREFIX}.${LIMITBASED_PREFIX}.limit`,
                  )}
                  onInputChange={(value: any) => {
                    setPaginationValue(
                      `${LIMITBASED_PREFIX}.limit`,
                      "value",
                      value,
                    );
                  }}
                  onSelectVariable={(_: any, dropdownOption: any) => {
                    const values = variablesList[dropdownOption.value];
                    Object.keys(values).forEach((key: string) => {
                      setPaginationValue(
                        `${LIMITBASED_PREFIX}.limit`,
                        key,
                        values[key],
                      );
                    });
                  }}
                  selectedVariable={{
                    label: props.limitBased?.limit?.name,
                    value: props.limitBased?.limit?.name,
                  }}
                  valueClassName="t--apiFormPaginationLimit"
                  valuePath={`${LIMITBASED_PREFIX}.limit.value`}
                  valueText="Limit Value"
                  valueTooltip="Override the value of the limit variable selected i.e. the no of rows returned"
                  variableText="Limit Variable"
                  variableTooltip="Select the limit variable from the query"
                  variablesOptions={variablesOptions}
                />
                {/* Offset */}
                <PaginationTypeBasedWrapper
                  dataReplayId={btoa(
                    `${PAGINATION_PREFIX}.${LIMITBASED_PREFIX}.offset`,
                  )}
                  onInputChange={(value: any) => {
                    setPaginationValue(
                      `${LIMITBASED_PREFIX}.offset`,
                      "value",
                      value,
                    );
                  }}
                  onSelectVariable={(_: any, dropdownOption: any) => {
                    const values = variablesList[dropdownOption.value];
                    Object.keys(values).forEach((key: string) => {
                      setPaginationValue(
                        `${LIMITBASED_PREFIX}.offset`,
                        key,
                        values[key],
                      );
                    });
                  }}
                  selectedVariable={{
                    label: props.limitBased?.offset?.name,
                    value: props.limitBased?.offset?.name,
                  }}
                  valueClassName="t--apiFormPaginationOffset"
                  valuePath={`${LIMITBASED_PREFIX}.offset.value`}
                  valueText="Offset Value"
                  valueTooltip="Override the value of the offset variable selected ie the no of rows omitted from the beginning"
                  variableText="Offset Variable"
                  variableTooltip="Select the offset variable from the query"
                  variablesOptions={variablesOptions}
                />
              </PaginationSection>
            </PaginationTypeView>,
            <PaginationTypeView key={`${PaginationType.CURSOR}-element`}>
              <Description type={TextType.P1}>
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
              </Description>
              <PaginationSection>
                <SubHeading type={TextType.P2}>
                  Configure Previous Page
                </SubHeading>
                {/* Previous Limit Value */}
                <PaginationTypeBasedWrapper
                  dataReplayId={btoa(
                    `${PAGINATION_PREFIX}.${CURSORBASED_PREFIX}.previous"`,
                  )}
                  onInputChange={(value: any) => {
                    setSeparateOrSameLimitValue({
                      actualKeyPath: `${CURSORBASED_PREFIX}.previous.limit.value`,
                      dependentKeyPath: `${CURSORBASED_PREFIX}.next.limit.value`,
                      value: value,
                      isSeparateEnabled: !!paginationPrev?.limit?.isSeparate,
                    });
                  }}
                  onSelectVariable={(_: any, dropdownOption: any) => {
                    const values = variablesList[dropdownOption.value];
                    Object.keys(values).forEach((key: string) => {
                      setPaginationValue(
                        `${CURSORBASED_PREFIX}.previous.limit`,
                        key,
                        values[key],
                      );
                    });
                  }}
                  selectedVariable={{
                    label: paginationPrev?.limit?.name,
                    value: paginationPrev?.limit?.name,
                  }}
                  valueClassName="t--apiFormPaginationCursorPrev"
                  valuePath="cursorBased.previous.limit.value"
                  valueText="Limit Variable Value"
                  valueTooltip="Override the value for the previous no of rows to be fetched"
                  variableText="Limit Variable Name"
                  variableTooltip="Select the variable from the query that holds the last/previous limit value"
                  variablesOptions={variablesOptions}
                />
                {/* Previous Cursor Values */}
                <PaginationTypeBasedWrapper
                  dataReplayId={btoa(
                    `${PAGINATION_PREFIX}.cursorBased.previous.cursor`,
                  )}
                  onInputChange={(value: any) => {
                    setPaginationValue(
                      `${CURSORBASED_PREFIX}.previous.cursor`,
                      "value",
                      value,
                    );
                  }}
                  onSelectVariable={(_: any, dropdownOption: any) => {
                    const values = variablesList[dropdownOption.value];
                    Object.keys(values).forEach((key: string) => {
                      setPaginationValue(
                        `${CURSORBASED_PREFIX}.previous.cursor`,
                        key,
                        values[key],
                      );
                    });
                  }}
                  selectedVariable={{
                    label: paginationPrev?.cursor?.name,
                    value: paginationPrev?.cursor?.name,
                  }}
                  valueClassName="t--apiFormPaginationCursorPrev"
                  valuePath={`${CURSORBASED_PREFIX}.previous.cursor.value`}
                  valuePlaceholder="{{Api1.data.previousCursor}}"
                  valueText="Start Cursor Value"
                  valueTooltip="Binding the widget action to the previous page activity"
                  variableText="Start Cursor Variable"
                  variableTooltip="Select the variable which holds the before cursor"
                  variablesOptions={variablesOptions}
                />
              </PaginationSection>
              <PaginationSection>
                <SubHeading type={TextType.P2}>Configure Next Page</SubHeading>
                {/* Next Limit Value */}
                <PaginationTypeBasedWrapper
                  dataReplayId={btoa(`${PAGINATION_PREFIX}.next.limit`)}
                  onInputChange={(value: any) => {
                    setPaginationValue(
                      `${CURSORBASED_PREFIX}.next.limit`,
                      "value",
                      value,
                    );
                  }}
                  onSelectVariable={(_: any, dropdownOption: any) => {
                    const values = variablesList[dropdownOption.value];
                    Object.keys(values).forEach((key: string) => {
                      setPaginationValue(
                        `${CURSORBASED_PREFIX}.next.limit`,
                        key,
                        values[key],
                      );
                    });
                  }}
                  onSeparateKeyChange={(value: any) => {
                    setPaginationValue(
                      `${CURSORBASED_PREFIX}.next.limit`,
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
                  separateKeyPath={`${CURSORBASED_PREFIX}.next.limit.isSeparate`}
                  separateValueFlag={!!paginationNext?.limit?.isSeparate}
                  valueClassName="t--apiFormPaginationCursorNext"
                  valuePath={`${CURSORBASED_PREFIX}.next.limit.value`}
                  valueText="Limit Variable Value"
                  valueTooltip="Override the value for the next no of rows to be fetched"
                  variableText="Limit Variable Name"
                  variableTooltip="Select the variable from the query that holds the first/next limit value"
                  variablesOptions={variablesOptions}
                />
                {/* Next Cursor Values */}
                <PaginationTypeBasedWrapper
                  dataReplayId={btoa(`${PAGINATION_PREFIX}.next.cursor`)}
                  onInputChange={(value: any) => {
                    setPaginationValue(
                      `${CURSORBASED_PREFIX}.next.cursor`,
                      "value",
                      value,
                    );
                  }}
                  onSelectVariable={(_: any, dropdownOption: any) => {
                    const values = variablesList[dropdownOption.value];
                    Object.keys(values).forEach((key: string) => {
                      setPaginationValue(
                        `${CURSORBASED_PREFIX}.next.cursor`,
                        key,
                        values[key],
                      );
                    });
                  }}
                  selectedVariable={{
                    label: paginationNext?.cursor?.name,
                    value: paginationNext?.cursor?.name,
                  }}
                  valueClassName="t--apiFormPaginationCursorNext"
                  valuePath={`${CURSORBASED_PREFIX}.next.cursor.value`}
                  valuePlaceholder="{{Api1.data.nextCursor}}"
                  valueText="End Cursor Value"
                  valueTooltip="Binding the widget action to the next page activity"
                  variableText="End Cursor Variable"
                  variableTooltip="Select the variable which holds the after cursor"
                  variablesOptions={variablesOptions}
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
  const pluginExtraData = selector(state, PAGINATION_PREFIX);

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
