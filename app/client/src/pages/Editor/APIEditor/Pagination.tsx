import React from "react";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";

import styled from "constants/DefaultTheme";
import DropdownField from "components/editorComponents/form/fields/DropdownField";
import FormRow from "components/editorComponents/FormRow";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";
import CalloutComponent from "components/designSystems/blueprint/CalloutComponent";
import { PaginationType } from "entities/Action";

interface PaginationProps {
  onTestClick: Function;
  paginationType: PaginationType;
}
const PaginationFieldWrapper = styled.div`
  display: flex;
  margin-bottom: 5px;
`;

const ExampleApi = styled.p`
  color: #ef7b63;
  font-family: monospace;
`;

const StyledLabel = styled.label`
  display: inline-block;
  margin-bottom: 4px;
`;

const PaginationTypeView = styled.div`
  padding: 0px 6px;
`;

const StyledDynamicTextField = styled(DynamicTextField)`
  &&&& {
    margin-right: 5px;
  }
`;

const TestButton = styled(BaseButton)`
  &&& {
    max-width: 72px;
    margin: 0 5px;
    min-height: 32px;
    padding-right: 4px;
  }
`;

export default function Pagination(props: PaginationProps) {
  return (
    <React.Fragment>
      <FormRow
        style={{
          marginBottom: 5,
        }}
      >
        <DropdownField
          placeholder="Method"
          name="actionConfiguration.paginationType"
          className="t--apiFormPaginationType"
          width={223}
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
        <StyledLabel>Previous url</StyledLabel>
        <PaginationFieldWrapper>
          <StyledDynamicTextField
            className="t--apiFormPaginationPrev"
            name="actionConfiguration.prev"
            singleLine
          />
          <TestButton
            className="t--apiFormPaginationPrevTest"
            accent="secondary"
            onClick={() => {
              props.onTestClick("PREV");
            }}
            text={"Test"}
            rightIcon={"play"}
          />
        </PaginationFieldWrapper>
        <StyledLabel>Next url</StyledLabel>
        <PaginationFieldWrapper>
          <StyledDynamicTextField
            className="t--apiFormPaginationNext"
            name="actionConfiguration.next"
            singleLine
          />
          <TestButton
            className="t--apiFormPaginationNextTest"
            accent="secondary"
            onClick={() => {
              props.onTestClick("NEXT");
            }}
            text={"Test"}
            rightIcon={"play"}
          />
        </PaginationFieldWrapper>
      </PaginationTypeView>
      <PaginationTypeView
        className={
          props.paginationType !== PaginationType.PAGE_NO ? "display-none" : ""
        }
      >
        <CalloutComponent>
          <p
            style={{
              marginBottom: "6px",
            }}
          >
            Configure the Table pageNo in the API.
          </p>
          <ExampleApi>
            http://api.example.com/users?pageNo={"{{Table1.pageNo}}"}
          </ExampleApi>
        </CalloutComponent>
      </PaginationTypeView>
    </React.Fragment>
  );
}
