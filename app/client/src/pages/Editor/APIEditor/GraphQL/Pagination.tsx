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
import { Dropdown, TextInput, Checkbox } from "components/ads";
import { AnyAction, bindActionCreators, Dispatch } from "redux";
import { connect } from "react-redux";
import { AppState } from "reducers";
import log from "loglevel";
import Tooltip from "components/ads/Tooltip";
import { FormLabel } from "components/editorComponents/form/fields/StyledFormComponents";
import { FormIcons } from "icons/FormIcons";

interface PaginationProps {
  onTestClick: (test?: "PREV" | "NEXT") => void;
  paginationType: PaginationType;
  theme?: EditorTheme;
  query: string;
  formName: string;
  change: (formName: string, id: string, value: any) => void;
  paginationPrev?: any;
  paginationNext?: any;
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

const Step = styled(FormLabel)`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-right: ${(props) => props.theme.spaces[6]}px;
  color: ${(props) => props.theme.colors.apiPane.pagination.bindingBg};
  width: 100%;
  p {
    text-decoration: underline;
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
`;

const graphqlParseVariables = (queryBody: string) => {
  const variables: any = {};
  try {
    const document = parse(queryBody);
    const query: Maybe<OperationDefinitionNode> = getOperationAST(document);
    if (!!query && query.variableDefinitions) {
      for (const varDef of query.variableDefinitions) {
        if (varDef?.variable && varDef?.type) {
          variables[varDef.variable?.name?.value] = {
            key: varDef.variable?.name?.value,
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
  valueData: any;
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
  valueData,
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
          <p className="label-icon-wrapper">
            {variableText}
            {variableTooltip && (
              <Tooltip content={variableTooltip} hoverOpenDelay={1000}>
                <FormIcons.HELP_ICON height={16} width={16} />
              </Tooltip>
            )}
          </p>
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
          <p className="label-icon-wrapper">{valueText}</p>
          {valueTooltip && (
            <Tooltip content={valueTooltip} hoverOpenDelay={1000}>
              <FormIcons.HELP_ICON height={16} width={16} />
            </Tooltip>
          )}
        </Step>
        <TextInput
          border
          className={valueClassName}
          defaultValue={valueData}
          disabled={separateKeyFlag && !separateValueFlag}
          name={valuePath}
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

  const variablesOptions = Object.keys(variablesList).map((variable: any) => ({
    label: variable,
    value: variable,
  }));

  const setPaginationValue = (keyPath: string, key: string, value: any) => {
    props.change(
      props.formName,
      `actionConfiguration.${keyPath}.${key}`,
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
        `actionConfiguration.${dependentKeyPath}`,
        value,
      );
    }

    props.change(props.formName, `actionConfiguration.${actualKeyPath}`, value);
  };

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
              value: PaginationType.LIMIT,
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
            <PaginationTypeView key={PaginationType.LIMIT}>
              <PaginationSection>
                <Description type={TextType.P1}>
                  Specify a specific limit (number of results) and offset (the
                  number of records that needed to be skipped).
                </Description>
                {/* Limit */}
                <PaginationTypeBasedWrapper
                  dataReplayId={btoa(
                    "actionConfiguration.pluginSpecifiedTemplates[2]",
                  )}
                  onInputChange={(value: any) => {
                    setPaginationValue(
                      "pluginSpecifiedTemplates[2].limit",
                      "value",
                      value,
                    );
                  }}
                  onSelectVariable={(_: any, dropdownOption: any) => {
                    const values = variablesList[dropdownOption.value];
                    Object.keys(values).forEach((key: string) => {
                      setPaginationValue(
                        "pluginSpecifiedTemplates[2].limit",
                        key,
                        values[key],
                      );
                    });
                  }}
                  selectedVariable={{
                    label: props.limitBased?.limit?.key,
                    value: props.limitBased?.limit?.key,
                  }}
                  valueClassName="t--apiFormPaginationLimit"
                  valueData={props.limitBased?.limit?.value}
                  valuePath="actionConfiguration.pluginSpecifiedTemplates[2].limit.value"
                  valueText="Limit Value"
                  variableText="Limit Variable"
                  variablesOptions={variablesOptions}
                />
                {/* Offset */}
                <PaginationTypeBasedWrapper
                  dataReplayId={btoa(
                    "actionConfiguration.pluginSpecifiedTemplates[2]",
                  )}
                  onInputChange={(value: any) => {
                    setPaginationValue(
                      "pluginSpecifiedTemplates[2].offset",
                      "value",
                      value,
                    );
                  }}
                  onSelectVariable={(_: any, dropdownOption: any) => {
                    const values = variablesList[dropdownOption.value];
                    Object.keys(values).forEach((key: string) => {
                      setPaginationValue(
                        "pluginSpecifiedTemplates[2].offset",
                        key,
                        values[key],
                      );
                    });
                  }}
                  selectedVariable={{
                    label: props.limitBased?.offset?.key,
                    value: props.limitBased?.offset?.key,
                  }}
                  valueClassName="t--apiFormPaginationOffset"
                  valueData={props.limitBased?.offset?.value}
                  valuePath="actionConfiguration.pluginSpecifiedTemplates[2].offset.value"
                  valueText="Offset Value"
                  variableText="Offset Variable"
                  variablesOptions={variablesOptions}
                />
              </PaginationSection>
            </PaginationTypeView>,
            <PaginationTypeView key={PaginationType.CURSOR}>
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
                <SubHeading type={TextType.P3}>
                  Configure Previous Page
                </SubHeading>
                {/* Previous Limit Value */}
                <PaginationTypeBasedWrapper
                  dataReplayId={btoa("actionConfiguration.prev.limit")}
                  onInputChange={(value: any) => {
                    setSeparateOrSameLimitValue({
                      actualKeyPath: "prev.limit.value",
                      dependentKeyPath: "next.limit.value",
                      value: value,
                      isSeparateEnabled: !!props.paginationNext?.limit
                        ?.isSeparate,
                    });
                  }}
                  onSelectVariable={(_: any, dropdownOption: any) => {
                    const values = variablesList[dropdownOption.value];
                    Object.keys(values).forEach((key: string) => {
                      setPaginationValue("prev.limit", key, values[key]);
                    });
                  }}
                  selectedVariable={{
                    label: props.paginationPrev?.limit?.key,
                    value: props.paginationPrev?.limit?.key,
                  }}
                  valueClassName="t--apiFormPaginationCursorPrev"
                  valueData={props.paginationPrev?.limit?.value}
                  valuePath="actionConfiguration.prev.limit.value"
                  valueText="Limit Variable Value"
                  variableText="Limit Variable Name"
                  variablesOptions={variablesOptions}
                />
                {/* Previous Cursor Values */}
                <PaginationTypeBasedWrapper
                  dataReplayId={btoa("actionConfiguration.prev.cursor")}
                  onInputChange={(value: any) => {
                    setPaginationValue("prev.cursor", "value", value);
                  }}
                  onSelectVariable={(_: any, dropdownOption: any) => {
                    const values = variablesList[dropdownOption.value];
                    Object.keys(values).forEach((key: string) => {
                      setPaginationValue("prev.cursor", key, values[key]);
                    });
                  }}
                  selectedVariable={{
                    label: props.paginationPrev?.cursor?.key,
                    value: props.paginationPrev?.cursor?.key,
                  }}
                  valueClassName="t--apiFormPaginationCursorPrev"
                  valueData={props.paginationPrev?.cursor?.value}
                  valuePath="actionConfiguration.prev.cursor.value"
                  valuePlaceholder="{{Table1.firstRow.cursor}}"
                  valueText="Start Cursor Value"
                  variableText="Start Cursor Variable"
                  variablesOptions={variablesOptions}
                />
              </PaginationSection>
              <PaginationSection>
                <SubHeading type={TextType.P3}>Configure Next Page</SubHeading>
                {/* Next Limit Value */}
                <PaginationTypeBasedWrapper
                  dataReplayId={btoa("actionConfiguration.next.limit")}
                  onInputChange={(value: any) => {
                    setPaginationValue("next.limit", "value", value);
                  }}
                  onSelectVariable={(_: any, dropdownOption: any) => {
                    const values = variablesList[dropdownOption.value];
                    Object.keys(values).forEach((key: string) => {
                      setPaginationValue("next.limit", key, values[key]);
                    });
                  }}
                  onSeparateKeyChange={(value: any) => {
                    setPaginationValue("next.limit", "isSeparate", value);
                  }}
                  selectedVariable={{
                    label: props.paginationNext?.limit?.key,
                    value: props.paginationNext?.limit?.key,
                  }}
                  separateKeyFlag
                  separateKeyLabel="Enable seperate value for first limit variable"
                  separateKeyPath="actionConfiguration.next.limit.isSeparate"
                  separateValueFlag={!!props.paginationNext?.limit?.isSeparate}
                  valueClassName="t--apiFormPaginationCursorNext"
                  valueData={props.paginationNext?.limit?.value}
                  valuePath="actionConfiguration.next.limit.value"
                  valueText="Limit Variable Value"
                  variableText="Limit Variable Name"
                  variablesOptions={variablesOptions}
                />
                {/* Next Cursor Values */}
                <PaginationTypeBasedWrapper
                  dataReplayId={btoa("actionConfiguration.next.cursor")}
                  onInputChange={(value: any) => {
                    setPaginationValue("next.cursor", "value", value);
                  }}
                  onSelectVariable={(_: any, dropdownOption: any) => {
                    const values = variablesList[dropdownOption.value];
                    Object.keys(values).forEach((key: string) => {
                      setPaginationValue("next.cursor", key, values[key]);
                    });
                  }}
                  selectedVariable={{
                    label: props.paginationNext?.cursor?.key,
                    value: props.paginationNext?.cursor?.key,
                  }}
                  valueClassName="t--apiFormPaginationCursorNext"
                  valueData={props.paginationNext?.cursor?.value}
                  valuePath="actionConfiguration.next.cursor.value"
                  valuePlaceholder="{{Table1.lastRow.cursor}}"
                  valueText="Start Cursor Value"
                  variableText="Start Cursor Variable"
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
  const paginationPrev = selector(state, "actionConfiguration.prev");
  const paginationNext = selector(state, "actionConfiguration.next");
  const limitBased = selector(
    state,
    "actionConfiguration.pluginSpecifiedTemplates[2]",
  );

  return {
    paginationPrev,
    paginationNext,
    limitBased,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<AnyAction>) => {
  return bindActionCreators({ change }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(Pagination);
