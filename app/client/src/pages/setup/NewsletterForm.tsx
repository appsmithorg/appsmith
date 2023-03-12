import { noop } from "lodash";
import React from "react";
import styled from "styled-components";
import { Toggle } from "design-system-old";
import { Button } from "design-system";
import {
  AllowToggle,
  AllowToggleLabel,
  AllowToggleWrapper,
  ButtonWrapper,
  FormBodyWrapper,
  FormHeaderIndex,
  FormHeaderLabel,
  FormHeaderWrapper,
} from "./common";
import { memo } from "react";
import {
  createMessage,
  WELCOME_FORM_NEWLETTER_HEADER,
  WELCOME_FORM_NEWLETTER_LABEL,
  WELCOME_FORM_SUBMIT_LABEL,
} from "@appsmith/constants/messages";

const NewsletterContainer = styled.div`
  width: 100%;
  position: relative;
  padding-left: ${(props) => props.theme.spaces[17] * 2}px;
  margin-top: ${(props) => props.theme.spaces[12] * 2}px;
`;

export default memo(function NewsletterForm() {
  return (
    <NewsletterContainer>
      <FormHeaderWrapper className="relative flex-col items-start">
        <FormHeaderIndex className="absolute -left-6">3.</FormHeaderIndex>
        <FormHeaderLabel>
          {createMessage(WELCOME_FORM_NEWLETTER_HEADER)}
        </FormHeaderLabel>
      </FormHeaderWrapper>
      <FormBodyWrapper>
        <AllowToggleWrapper>
          <AllowToggle>
            <Toggle
              className="t--welcome-form-newsletter"
              name="signupForNewsletter"
              onToggle={() => noop}
              value
            />
          </AllowToggle>
          <AllowToggleLabel>
            {createMessage(WELCOME_FORM_NEWLETTER_LABEL)}
          </AllowToggleLabel>
        </AllowToggleWrapper>
        <ButtonWrapper>
          <Button
            className="t--welcome-form-create-button"
            size="md"
            type="submit"
          >
            {createMessage(WELCOME_FORM_SUBMIT_LABEL)}
          </Button>
        </ButtonWrapper>
      </FormBodyWrapper>
    </NewsletterContainer>
  );
});
