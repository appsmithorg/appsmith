import React, { useEffect, useState } from "react";
import { parse, getOperationAST, OperationDefinitionNode } from "graphql";
import styled from "constants/DefaultTheme";
import { change, formValueSelector } from "redux-form";
import FormRow from "components/editorComponents/FormRow";
import { PaginationType } from "entities/Action";
import RadioFieldGroup from "components/editorComponents/form/fields/RadioGroupField";
import Text, { Case, TextType } from "components/ads/Text";
import {
  CodeEditorBorder,
  EditorTheme,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { Maybe } from "graphql/jsutils/Maybe";
import { Dropdown } from "components/ads";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import { AnyAction, bindActionCreators, Dispatch } from "redux";
import { connect } from "react-redux";
import { AppState } from "reducers";
import log from "loglevel";

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
const PaginationFieldWrapper = styled.div`
  display: flex;
  margin-bottom: ${(props) => props.theme.spaces[5]}px;
  justify-content: space-between;
  width: 100%;
`;

const Description = styled(Text)`
  display: block;
  margin-bottom: ${(props) => props.theme.spaces[6]}px;
  color: ${(props) => props.theme.colors.apiPane.pagination.description};
`;

const SubHeading = styled(Text)`
  display: block;
  margin-bottom: ${(props) => props.theme.spaces[3]}px;
  color: ${(props) => props.theme.colors.apiPane.pagination.description};
`;

const Step = styled(Text)`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-right: ${(props) => props.theme.spaces[6]}px;
  color: ${(props) => props.theme.colors.apiPane.pagination.label};
  width: 20%;
`;

const PaginationTypeView = styled.div`
  margin-left: 20px;
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
  flex-direction: column;
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

type PaginationCursorBasedWrapperProps = {
  dataReplayId: string;
  onSelectVariable: any;
  selectedVariable: any;
  valueClassName: string;
  valuePath: string;
  valueText: string;
  variablesOptions: Array<any>;
  variableText: string;
};

function PaginationCursorBasedWrapper({
  dataReplayId,
  onSelectVariable,
  selectedVariable,
  valueClassName,
  valuePath,
  valueText,
  variablesOptions,
  variableText,
}: PaginationCursorBasedWrapperProps) {
  return (
    <PaginationFieldContainer>
      <PaginationFieldWrapper data-replay-id={dataReplayId}>
        <Step type={TextType.P2}>{variableText}</Step>
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
        <Step type={TextType.P2}>{valueText}</Step>
        <DynamicTextField
          border={CodeEditorBorder.ALL_SIDE}
          className={valueClassName}
          fill={!!true}
          height="100%"
          name={valuePath}
        />
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

  return (
    <PaginationContainer>
      <FormRow>
        <RadioFieldGroup
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
        />
      </FormRow>

      {props.paginationType === PaginationType.CURSOR ? (
        <PaginationTypeView>
          <Description case={Case.UPPERCASE} type={TextType.H6}>
            Pagination via Cursor based
          </Description>
          <PaginationSection>
            <SubHeading type={TextType.P1}>Previous Data</SubHeading>
            {/* Previous Cursor Values */}
            <PaginationCursorBasedWrapper
              dataReplayId={btoa("actionConfiguration.prev.cursor")}
              onSelectVariable={(_: any, dropdownOption: any) => {
                const values = variablesList[dropdownOption.value];
                Object.keys(values).forEach((key: string) => {
                  setPaginationValue(
                    "prev.cursor",
                    key,
                    dropdownOption.value[key],
                  );
                });
              }}
              selectedVariable={props.paginationPrev?.cursor?.key}
              valueClassName="t--apiFormPaginationCursorPrev"
              valuePath="actionConfiguration.prev.cursor.value"
              valueText="Start Cursor Value"
              variableText="Start Cursor Variable"
              variablesOptions={variablesOptions}
            />
            {/* Previous Limit Value */}
            <PaginationCursorBasedWrapper
              dataReplayId={btoa("actionConfiguration.prev.limit")}
              onSelectVariable={(_: any, dropdownOption: any) => {
                const values = variablesList[dropdownOption.value];
                Object.keys(values).forEach((key: string) => {
                  setPaginationValue(
                    "prev.limit",
                    key,
                    dropdownOption.value[key],
                  );
                });
              }}
              selectedVariable={props.paginationPrev?.limit?.key}
              valueClassName="t--apiFormPaginationCursorPrev"
              valuePath="actionConfiguration.prev.limit.value"
              valueText="Limit Variable Value"
              variableText="Limit Variable Name"
              variablesOptions={variablesOptions}
            />
          </PaginationSection>
          <PaginationSection>
            <SubHeading type={TextType.P1}>Next Data</SubHeading>
            {/* Next Cursor Values */}
            <PaginationCursorBasedWrapper
              dataReplayId={btoa("actionConfiguration.next.cursor")}
              onSelectVariable={(_: any, dropdownOption: any) => {
                const values = variablesList[dropdownOption.value];
                Object.keys(values).forEach((key: string) => {
                  setPaginationValue(
                    "next.cursor",
                    key,
                    dropdownOption.value[key],
                  );
                });
              }}
              selectedVariable={props.paginationNext?.cursor?.key}
              valueClassName="t--apiFormPaginationCursorNext"
              valuePath="actionConfiguration.next.cursor.value"
              valueText="Start Cursor Value"
              variableText="Start Cursor Variable"
              variablesOptions={variablesOptions}
            />
            {/* Next Limit Value */}
            <PaginationCursorBasedWrapper
              dataReplayId={btoa("actionConfiguration.next.limit")}
              onSelectVariable={(_: any, dropdownOption: any) => {
                const values = variablesList[dropdownOption.value];
                Object.keys(values).forEach((key: string) => {
                  setPaginationValue(
                    "next.limit",
                    key,
                    dropdownOption.value[key],
                  );
                });
              }}
              selectedVariable={props.paginationNext?.limit?.key}
              valueClassName="t--apiFormPaginationCursorNext"
              valuePath="actionConfiguration.next.limit.value"
              valueText="Limit Variable Value"
              variableText="Limit Variable Name"
              variablesOptions={variablesOptions}
            />
          </PaginationSection>
        </PaginationTypeView>
      ) : props.paginationType === PaginationType.LIMIT ? (
        <PaginationTypeView>
          <Description case={Case.UPPERCASE} type={TextType.H6}>
            Pagination via Limit based
          </Description>
          <PaginationSection>
            {/* Limit Variable */}
            <PaginationFieldContainer>
              <PaginationFieldWrapper
                data-replay-id={btoa(
                  "actionConfiguration.pluginSpecifiedTemplates[2]",
                )}
              >
                <Step type={TextType.P2}>Limit Variable</Step>
                <Dropdown
                  boundary="viewport"
                  dropdownMaxHeight={"200px"}
                  fillOptions
                  onSelect={(_: any, dropdownOption: any) => {
                    const values = variablesList[dropdownOption.value];
                    Object.keys(values).forEach((key: string) => {
                      setPaginationValue(
                        "pluginSpecifiedTemplates[2].limit",
                        key,
                        dropdownOption.value[key],
                      );
                    });
                  }}
                  options={variablesOptions}
                  selected={props.limitBased?.limit?.key}
                  showLabelOnly
                  width={"100%"}
                />
              </PaginationFieldWrapper>
            </PaginationFieldContainer>
            {/* Offset Variable */}
            <PaginationFieldContainer>
              <PaginationFieldWrapper
                data-replay-id={btoa(
                  "actionConfiguration.pluginSpecifiedTemplates[2]",
                )}
              >
                <Step type={TextType.P2}>Offset Variable</Step>
                <Dropdown
                  boundary="viewport"
                  dropdownMaxHeight={"200px"}
                  fillOptions
                  onSelect={(_: any, dropdownOption: any) => {
                    const values = variablesList[dropdownOption.value];
                    Object.keys(values).forEach((key: string) => {
                      setPaginationValue(
                        "pluginSpecifiedTemplates[2].offset",
                        key,
                        dropdownOption.value[key],
                      );
                    });
                  }}
                  options={variablesOptions}
                  selected={props.limitBased?.offset?.key}
                  showLabelOnly
                  width={"100%"}
                />
              </PaginationFieldWrapper>
            </PaginationFieldContainer>
          </PaginationSection>
        </PaginationTypeView>
      ) : null}
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
