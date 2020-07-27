import React, { ReactNode } from "react";
import FormDialogComponent from "components/editorComponents/form/FormDialogComponent";
import { ControlGroup, InputGroup, IIconProps } from "@blueprintjs/core";
import Button from "components/editorComponents/Button";
import styled from "styled-components";
import _ from "lodash";

const SubHeaderWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: ${props => props.theme.spaces[5]}px
    ${props => props.theme.spaces[5]}px;
`;
const StyledAddButton = styled(Button)<IIconProps>`
  &&& {
    outline: none;
  }
`;
const SearchContainer = styled.div`
  &&& {
    .bp3-input {
      width: 200% !important;
    }
  }
`;

type SubHeaderProps = {
  add?: {
    form: ReactNode;
    title: string;
    formName: string;
    isAdding: boolean;
    formSubmitIntent: string;
    errorAdding?: string;
    formSubmitText: string;
    onClick: () => void;
  };
  search?: {
    placeholder: string;
    debounce?: boolean;
    queryFn?: (keyword: string) => void;
  };
};

export const ApplicationsSubHeader = (props: SubHeaderProps) => {
  const query =
    props.search &&
    props.search.queryFn &&
    _.debounce(props.search.queryFn, 250, { maxWait: 1000 });
  const searchQuery = (e: any) => {
    query && query(e.target.value);
  };

  const createTrigger = props.add && (
    <StyledAddButton
      text={props.add.title}
      icon="plus"
      title={props.add.title}
      onClick={props.add.onClick}
      filled
      intent="primary"
    />
  );

  return (
    <SubHeaderWrapper>
      <SearchContainer>
        {props.search && (
          <ControlGroup>
            <InputGroup
              placeholder={props.search.placeholder}
              leftIcon="search"
              onChange={searchQuery}
              className="t--application-search-input"
            />
          </ControlGroup>
        )}
      </SearchContainer>

      {props.add && (
        <FormDialogComponent
          trigger={createTrigger}
          Form={props.add.form}
          title={props.add.title}
        />
      )}
    </SubHeaderWrapper>
  );
};

export default ApplicationsSubHeader;
