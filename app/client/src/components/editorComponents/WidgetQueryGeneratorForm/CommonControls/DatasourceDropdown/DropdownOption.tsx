import { Icon, MenuItem } from "@appsmith/ads";
import React from "react";
import styled from "styled-components";
import { DEFAULT_QUERY_OPTIONS_COUNTS_TO_SHOW } from "../../constants";

const Container = styled.div`
  display: flex;
  width: calc(100% - 10px);
  height: 100%;
`;

const LeftSection = styled.div`
  width: calc(100% - 16px);
  display: flex;
  align-items: center;
  height: 100%;
`;

const IconContainer = styled.div`
  width: 24px;
  display: flex;
  align-items: center;
`;

const Label = styled.div`
  width: calc(100% - 40px);
  overflow: hidden;
  text-overflow: ellipsis;
`;

interface Props {
  label?: JSX.Element | string;
  leftIcon?: JSX.Element;
  rightIcon?: JSX.Element;
  className?: string;
}

export function DropdownOption(props: Props) {
  const { className, label, leftIcon, rightIcon } = props;

  return (
    <Container className={className}>
      <LeftSection>
        {leftIcon && <IconContainer>{leftIcon}</IconContainer>}
        <Label>{label}</Label>
      </LeftSection>
      {rightIcon && <IconContainer>{rightIcon}</IconContainer>}
    </Container>
  );
}

interface LoadmoreProps {
  count: number;
  onLoadMore: () => void;
}

export function LoadMoreOptions(props: LoadmoreProps) {
  if (props.count > DEFAULT_QUERY_OPTIONS_COUNTS_TO_SHOW) {
    return (
      <MenuItem>
        <div
          data-testId="t--one-click-binding-datasource--load-more"
          onMouseDown={(e) => {
            e?.stopPropagation();
          }}
          onMouseUp={(e) => {
            e?.stopPropagation();
            props.onLoadMore();
          }}
        >
          <DropdownOption
            label={`Load ${
              props.count - DEFAULT_QUERY_OPTIONS_COUNTS_TO_SHOW
            } more`}
            leftIcon={<Icon name="context-menu" size="md" />}
          />
        </div>
      </MenuItem>
    );
  } else {
    return null;
  }
}
