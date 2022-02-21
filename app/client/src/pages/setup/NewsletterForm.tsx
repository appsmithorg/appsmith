import { noop } from "lodash";
import React from "react";
import styled from "styled-components";
import Button, { Category, Size } from "components/ads/Button";
import Toggle from "components/ads/Toggle";
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

export const StyledButton = styled(Button)`
  width: 201px;
  height: 38px;
`;

const NewsletterContainer = styled.div`
  widht: 100%;
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
          <StyledButton
            category={Category.primary}
            className="t--welcome-form-create-button"
            size={Size.medium}
            tag="button"
            text={createMessage(WELCOME_FORM_SUBMIT_LABEL)}
          />
        </ButtonWrapper>
      </FormBodyWrapper>
    </NewsletterContainer>
  );
});
