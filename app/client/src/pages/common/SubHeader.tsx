import React, { ReactNode, useState, useEffect } from "react";
import FormDialogComponent from "components/designSystems/blueprint/FormDialogComponent";
import {
  ControlGroup,
  InputGroup,
  Button,
  IIconProps,
} from "@blueprintjs/core";
import styled from "styled-components";

const SubHeaderWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 ${props => props.theme.spaces[5]}px;
`;
const StyledAddButton = styled(Button)<IIconProps>`
  &&& {
    background: ${props => props.theme.colors.primary};
    span {
      color: white;
    }
    outline: none;
  }
`;
const SearchContainer = styled.div``;

type ApplicationsSubHeaderProps = {
  add?: {
    form: ReactNode;
    title: string;
    formName: string;
    isAdding: boolean;
    formSubmitIntent: string;
    errorAdding?: string;
  };
  search?: {
    placeholder: string;
  };
};

export const ApplicationsSubHeader = (props: ApplicationsSubHeaderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const openForm = () => {
    setIsOpen(true);
  };
  const closeForm = () => {
    setIsOpen(false);
  };
  useEffect(() => {
    if (props.add && !props.add.isAdding) {
      setIsOpen(false);
    }
  }, [props.add]);
  return (
    <SubHeaderWrapper>
      <SearchContainer>
        {props.search && (
          <ControlGroup>
            <InputGroup
              placeholder={props.search.placeholder}
              leftIcon="search"
            />
          </ControlGroup>
        )}
      </SearchContainer>
      {props.add && (
        <StyledAddButton
          text={props.add.title}
          icon="plus"
          title={props.add.title}
          onClick={openForm}
          minimal
        />
      )}
      {props.add && (
        <FormDialogComponent
          isOpen={isOpen}
          formName={props.add.formName}
          form={props.add.form}
          error={props.add.errorAdding}
          title={props.add.title}
          isSubmitting={props.add.isAdding}
          onClose={closeForm}
          submitIntent={props.add.formSubmitIntent}
        />
      )}
    </SubHeaderWrapper>
  );
};

export default ApplicationsSubHeader;
