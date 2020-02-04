import React from "react";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import { Button } from "@blueprintjs/core";
import styled from "constants/DefaultTheme";
import CheckboxField from "components/editorComponents/form/fields/CheckboxField";
interface PaginationProps {
  onTestClick: Function;
}
const PaginationFieldWrapper = styled.div`
  display: flex;
`;
export default function Pagination(props: PaginationProps) {
  return (
    <div>
      <div>
        <CheckboxField
          name="actionConfiguration.isPaginated"
          intent={"primary"}
          align={"left"}
          label={"Is Paginated?"}
        ></CheckboxField>
      </div>
      <label>Previous url</label>
      <PaginationFieldWrapper>
        <DynamicTextField name="actionConfiguration.prev" />
        <Button
          onClick={() => {
            props.onTestClick("PREV");
          }}
          text={"Test"}
          rightIcon={"play"}
        ></Button>
      </PaginationFieldWrapper>
      <label>Next url</label>
      <PaginationFieldWrapper>
        <DynamicTextField name="actionConfiguration.next" />
        <Button
          onClick={() => {
            props.onTestClick("NEXT");
          }}
          text={"Test"}
          rightIcon={"play"}
        ></Button>
      </PaginationFieldWrapper>
    </div>
  );
}
