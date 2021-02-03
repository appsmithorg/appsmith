import React, { useState } from "react";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";

import styled from "constants/DefaultTheme";
import FormRow from "components/editorComponents/FormRow";
import { PaginationType } from "entities/Action";
import RadioFieldGroup from "components/editorComponents/form/fields/RadioGroupField";
import Text, { Case, TextType } from "components/ads/Text";
import Button, { Category, Size } from "components/ads/Button";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import Dropdown from "components/ads/Dropdown";
import { Variant } from "components/ads/common";

interface PaginationProps {
  onTestClick: (test?: "PREV" | "NEXT") => void;
  paginationType: PaginationType;
  theme?: EditorTheme;
}
const PaginationFieldWrapper = styled.div`
  display: flex;
  margin-bottom: ${(props) => props.theme.spaces[5]}px;

  button {
    margin-left: ${(props) => props.theme.spaces[5]}px;
  }
`;

const StyledLabel = styled(Text)`
  display: inline-block;
  margin-bottom: ${(props) => props.theme.spaces[3]}px;
  color: ${(props) => props.theme.colors.apiPane.pagination.label};
`;

const Description = styled(Text)`
  display: block;
  margin-bottom: ${(props) => props.theme.spaces[6]}px;
  color: ${(props) => props.theme.colors.apiPane.pagination.description};
`;

const StepTitle = styled.div`
  margin-bottom: ${(props) => props.theme.spaces[4]}px;
  span {
    color: ${(props) => props.theme.colors.apiPane.pagination.stepTitle};
  }
`;

const TableRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${(props) => props.theme.spaces[8]}px;
  button {
    margin-left: ${(props) => props.theme.spaces[5]}px;
    height: 34px;
    padding: 0 ${(props) => props.theme.spaces[5]}px;
  }
`;

const PaginationTypeView = styled.div`
  margin-left: 350px;
  width: 100%;
`;

const PaginationSection = styled.div`
  display: flex;
  padding: ${(props) => props.theme.spaces[8]}px
    ${(props) => props.theme.spaces[12]}px;
`;

const Example = styled.div<{ editorTheme?: EditorTheme }>`
  display: flex;
  width: fit-content;
  align-items: center;
  ${(props) =>
    props.editorTheme === EditorTheme.DARK
      ? `
padding: ${props.theme.spaces[4]}px ${props.theme.spaces[5]}px;
  `
      : null};
  background: ${(props) => props.theme.colors.apiPane.pagination.exampleBg};
  span {
    color: ${(props) => props.theme.colors.apiPane.pagination.label};
  }
`;

const BindingKey = styled.div`
  padding: ${(props) => props.theme.spaces[1] - 2}px
    ${(props) => props.theme.spaces[1]}px;
  margin-left: ${(props) => props.theme.spaces[4]}px;
  background: ${(props) => props.theme.colors.apiPane.pagination.bindingBg};
`;

export default function Pagination(props: PaginationProps) {
  const [selectedTable, setSelectedTable] = useState<string>("none");

  return (
    <PaginationSection>
      <FormRow
        style={{
          position: "fixed",
        }}
      >
        <RadioFieldGroup
          placeholder="Method"
          name="actionConfiguration.paginationType"
          className="t--apiFormPaginationType"
          rows={3}
          options={[
            {
              label: "None",
              value: PaginationType.NONE,
            },
            {
              label: "Paginate with Table Page No",
              value: PaginationType.PAGE_NO,
            },
            {
              label: "Paginate with Response Url",
              value: PaginationType.URL,
            },
          ]}
        />
      </FormRow>

      <PaginationTypeView
        className={
          props.paginationType !== PaginationType.URL ? "display-none" : ""
        }
      >
        <Description type={TextType.H6} case={Case.UPPERCASE}>
          Pagination with response url
        </Description>
        <StepTitle>
          <Text type={TextType.H5}>Step 1 - </Text>
          <Text type={TextType.P1}>Configure Table for Pagination</Text>
        </StepTitle>
        <Description type={TextType.P3}>
          Enable server side pagination and configure OnPageChange action
        </Description>
        <StyledLabel type={TextType.P3}>Select Table</StyledLabel>
        <TableRow>
          <Dropdown
            options={[
              { value: "UsersTable" },
              { value: "InfoTable" },
              { value: "DataTable" },
            ]}
            selected={{ value: "Select" }}
            onSelect={(value?: string) => setSelectedTable(value || "none")}
          />
          {selectedTable === "none" ? (
            <Button
              category={Category.tertiary}
              text={"Configure"}
              size={Size.medium}
              tag="button"
            />
          ) : (
            <Button
              category={Category.secondary}
              variant={Variant.danger}
              text={"Reset"}
              size={Size.medium}
              tag="button"
            />
          )}
        </TableRow>
        <StepTitle>
          <Text type={TextType.H5}>Step 2 - </Text>
          <Text type={TextType.P1}>Configure URL</Text>
        </StepTitle>
        <Description type={TextType.P3}>
          Configure Next and Previous URL{" "}
        </Description>
        <StyledLabel type={TextType.P3}>Previous url</StyledLabel>
        <PaginationFieldWrapper>
          <DynamicTextField
            className="t--apiFormPaginationPrev"
            name="actionConfiguration.prev"
            theme={props.theme}
          />
          <Button
            className="t--apiFormPaginationPrevTest"
            category={Category.tertiary}
            onClick={() => {
              props.onTestClick("PREV");
            }}
            text={"Test"}
            size={Size.medium}
            tag="button"
          />
        </PaginationFieldWrapper>
        <StyledLabel type={TextType.P3}>Next url</StyledLabel>
        <PaginationFieldWrapper>
          <DynamicTextField
            className="t--apiFormPaginationNext"
            name="actionConfiguration.next"
            theme={props.theme}
          />
          <Button
            className="t--apiFormPaginationNextTest"
            category={Category.tertiary}
            onClick={() => {
              props.onTestClick("NEXT");
            }}
            text={"Test"}
            size={Size.medium}
            tag="button"
          />
        </PaginationFieldWrapper>
      </PaginationTypeView>
      <PaginationTypeView
        className={
          props.paginationType !== PaginationType.PAGE_NO ? "display-none" : ""
        }
      >
        <Description type={TextType.H6} case={Case.UPPERCASE}>
          Pagination with Table Page number
        </Description>
        <StepTitle>
          <Text type={TextType.H5}>Step 1 - </Text>
          <Text type={TextType.P1}>Configure Table for Pagination</Text>
        </StepTitle>
        <Description type={TextType.P3}>
          Enable server side pagination and configure OnPageChange action
        </Description>
        <StyledLabel type={TextType.P3}>Select Table</StyledLabel>
        <TableRow>
          <Dropdown
            options={[
              { value: "UsersTable" },
              { value: "InfoTable" },
              { value: "DataTable" },
            ]}
            selected={{ value: "Select" }}
            onSelect={(value?: string) => setSelectedTable(value || "select")}
          />
          {selectedTable === "none" ? (
            <Button
              category={Category.tertiary}
              text={"Configure"}
              size={Size.medium}
              tag="button"
            />
          ) : (
            <Button
              category={Category.secondary}
              variant={Variant.danger}
              text={"Reset"}
              size={Size.medium}
              tag="button"
            />
          )}
        </TableRow>
        <StepTitle>
          <Text type={TextType.H5}>Step 2 - </Text>
          <Text type={TextType.P1}>Configure Request Parameters</Text>
        </StepTitle>
        <Description type={TextType.P3}>
          Map appropiate parameter or header in your request to UsersTable’s
          page number property
        </Description>
        <Example editorTheme={props.theme}>
          <Text type={TextType.P2}>
            Example - Map key <i>pageNo</i> or similar to value
          </Text>
          <BindingKey>
            <Text type={TextType.P2}>{"{{UsersTable.pageNo}}"}</Text>
          </BindingKey>
        </Example>
        {/* <CalloutComponent>
          <p
            style={{
              marginBottom: "6px",
            }}
          >
            1. Configure the Table pageNo in the API.
          </p>
          <ExampleApi>
            http://api.example.com/users?pageNo={"{{Table1.pageNo}}"}
          </ExampleApi>
        </CalloutComponent>
        <CalloutComponent>
          <p
            style={{
              marginBottom: "6px",
            }}
          >
            2. Enable server side pagination in Table1
          </p>
        </CalloutComponent>
        <CalloutComponent>
          <p
            style={{
              marginBottom: "6px",
            }}
          >
            3. Call this API onPageChange in Table1.
          </p>
        </CalloutComponent> */}
      </PaginationTypeView>
    </PaginationSection>
  );
}
