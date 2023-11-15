import React, { useState } from "react";
import styled from "styled-components";
import { Collapse } from "@blueprintjs/core";
import {
  Button,
  Category,
  Size,
  Text,
  TextType,
} from "@design-system/widgets-old";
import { messages } from "../constants";

const ChartErrorContainer = styled.div`
  height: 100%;
  width: 100%;
  background: var(--ads-v2-color-bg);
  position: absolute;
  top: 0px;
  left: 0px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}`;

const ErrorBox = styled.div`
  height: 60%;
  width: 80%;
  display: flex;
  align-items: center;
  flex-flow: column;
  gap: 8px;
  overflow-y: scroll;
}`;

const MoreDetailsButton = styled(Button)`
  flex-shrink: 2;
  border-radius: 4px;
  text-transform: none;
`;

const Title = styled(Text)`
  font-weight: var(--ads-font-weight-bold-xl);
`;

export interface ChartErrorProps {
  error?: Error;
  message?: string;
  stack?: string;
}

export function ChartErrorComponent(props: ChartErrorProps) {
  const [bodyCollapsed, setBodyCollapsed] = useState(true);

  const errorMessage = () => {
    const title = messages.ErrorTitle;
    const subheading = props.error?.message ?? props.message ?? "";
    const body = props.error?.stack ?? props.stack ?? "";

    return {
      title: title,
      subheading: subheading,
      body: body,
    };
  };

  function toggleBody() {
    setBodyCollapsed(!bodyCollapsed);
  }

  const arrowIconName = () => {
    if (bodyCollapsed) {
      return "expand-more";
    } else {
      return "expand-less";
    }
  };

  return (
    <ChartErrorContainer>
      <ErrorBox>
        <Text type={TextType.H4}>{errorMessage().title}</Text>
        <Title type={TextType.H4}>{errorMessage().subheading}</Title>
        <MoreDetailsButton
          category={Category.tertiary}
          icon={arrowIconName()}
          onClick={toggleBody}
          size={Size.large}
          tag="button"
          text={messages.MoreDetails}
          width="200px"
        />
        <Collapse isOpen={!bodyCollapsed}>
          <Text type={TextType.P1}>{errorMessage().body}</Text>
        </Collapse>
      </ErrorBox>
    </ChartErrorContainer>
  );
}
