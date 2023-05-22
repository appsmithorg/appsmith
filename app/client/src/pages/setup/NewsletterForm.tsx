import { noop } from "lodash";
import React from "react";
import styled from "styled-components";
import { Button, Switch } from "design-system";
import {
  AllowToggle,
  AllowToggleWrapper,
  ButtonWrapper,
  FormBodyWrapper,
  FormHeaderIndex,
  FormHeaderLabel,
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
      <div className="relative flex-col items-start">
        <FormHeaderIndex className="absolute -left-6">3.</FormHeaderIndex>
        <FormHeaderLabel>
          {createMessage(WELCOME_FORM_NEWLETTER_HEADER)}
        </FormHeaderLabel>
      </div>
      <FormBodyWrapper>
        <AllowToggleWrapper>
          <AllowToggle>
            <Switch
              className="t--welcome-form-newsletter"
              defaultSelected
              name="signupForNewsletter"
              onChange={() => noop}
              value={"true"}
            >
              {createMessage(WELCOME_FORM_NEWLETTER_LABEL)}
            </Switch>
          </AllowToggle>
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
