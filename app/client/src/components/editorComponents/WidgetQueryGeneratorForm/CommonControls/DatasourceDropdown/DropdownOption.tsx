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

const LabelContainer = styled.div`
  width: calc(100% - 40px);
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const Label = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SubText = styled.span`
  font-size: 12px;
  color: var(--ads-v2-color-fg-muted);
`;

interface Props {
  className?: string;
  label?: JSX.Element | string;
  leftIcon?: JSX.Element;
  rightIcon?: JSX.Element;
  subText?: string;
}

export function DropdownOption(props: Props) {
  const { className, label, leftIcon, rightIcon, subText } = props;

  return (
    <Container className={className}>
      <LeftSection>
        {leftIcon && <IconContainer>{leftIcon}</IconContainer>}
        <LabelContainer>
          <Label>{label}</Label>
          {subText && <SubText>{subText}</SubText>}
        </LabelContainer>
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
          data-testid="t--one-click-binding-datasource--load-more"
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
