import React from "react";
import styled from "styled-components";
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
import {
  Popover,
  Button,
  Position,
  IIconProps,
  PopoverInteractionKind,
} from "@blueprintjs/core";

const StyledAddButton = styled(Button)<IIconProps>`
  &&& {
    background: ${props => props.theme.colors.primary};
    span {
      color: white;
    }
  }
`;

type ApplicationsHeaderProps = {
  add?: {
    form: JSX.Element;
    title: string;
  };
};

export const ApplicationsHeader = (props: ApplicationsHeaderProps) => {
  return (
    <StyledHeader>
      {props.add && (
        <Popover
          interactionKind={PopoverInteractionKind.CLICK}
          popoverClassName="bp3-popover-content-sizing"
          position={Position.BOTTOM}
        >
          <StyledAddButton
            text={props.add.title}
            icon="plus"
            title={props.add.title}
            minimal
            large
          />
          {props.add.form}
        </Popover>
      )}
    </StyledHeader>
  );
};

export default ApplicationsHeader;
