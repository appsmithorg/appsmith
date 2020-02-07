import React from "react";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
// import { Button } from "@blueprintjs/core";
import Button from "components/editorComponents/Button";

import styled from "constants/DefaultTheme";
import DropdownField from "components/editorComponents/form/fields/DropdownField";
import FormRow from "components/editorComponents/FormRow";
import { Directions } from "utils/helpers";
import { Callout } from "@blueprintjs/core";
interface PaginationProps {
  onTestClick: Function;
  paginationType: PaginationType;
}
const PaginationFieldWrapper = styled.div`
  display: flex;
  margin-bottom: 5px;
`;

export enum PaginationType {
  "NONE" = "NONE",
  "PAGE_NO" = "PAGE_NO",
  "URL" = "URL",
}

const ExampleApi = styled.p`
  color: #ef7b63;
`;

const StyledLabel = styled.label`
  display: inline-block;
  margin-bottom: 4px;
`;

const PaginationTypeView = styled.div`
  padding: 0px 6px;
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
          <DynamicTextField name="actionConfiguration.prev" />
          <Button
            onClick={() => {
              props.onTestClick("PREV");
            }}
            text={"Test"}
            icon={"play"}
            iconAlignment={Directions.RIGHT}
            filled
          ></Button>
        </PaginationFieldWrapper>
        <StyledLabel>Next url</StyledLabel>
        <PaginationFieldWrapper>
          <DynamicTextField name="actionConfiguration.next" />
          <Button
            onClick={() => {
              props.onTestClick("NEXT");
            }}
            text={"Test"}
            icon={"play"}
            iconAlignment={Directions.RIGHT}
            // rightIcon={"play"}
            filled
          ></Button>
        </PaginationFieldWrapper>
      </PaginationTypeView>
      <PaginationTypeView
        className={
          props.paginationType !== PaginationType.PAGE_NO ? "display-none" : ""
        }
      >
        <Callout>
          <p
            style={{
              marginBottom: "6px",
            }}
          >
            Use Table pageNo and pageSize to configure the url.
          </p>
          <ExampleApi>
            http://api.example.com/users?pageNo={"{{Table.pageNo}}"}
            &amp;pageSize={"{{Table.pageSize}}"}
          </ExampleApi>
        </Callout>
      </PaginationTypeView>
    </React.Fragment>
  );
}
