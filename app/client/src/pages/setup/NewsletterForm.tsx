import { noop } from "lodash";
import React from "react";
import styled from "styled-components";
import { Category, Size } from "components/ads/Button";
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
  StyledButton,
} from "./common";
import { memo } from "react";

const NewsletterContainer = styled.div`
  widht: 100%;
  position: relative;
  padding-left: ${(props) => props.theme.spaces[17] * 2}px;
  margin-top: ${(props) => props.theme.spaces[12] * 2}px;
`;

type NewsletterFormProps = {
  invalid: boolean;
};

export default memo(function NewsletterForm(props: NewsletterFormProps) {
  return (
    <NewsletterContainer>
      <FormHeaderWrapper>
        <FormHeaderIndex>3/3</FormHeaderIndex>
        <FormHeaderLabel>Stay in touch</FormHeaderLabel>
      </FormHeaderWrapper>
      <FormBodyWrapper>
        <AllowToggleWrapper>
          <AllowToggle>
            <Toggle name="signupForNewsletter" onToggle={() => noop} value />
          </AllowToggle>
          <AllowToggleLabel>Get updates. We do not spam you.</AllowToggleLabel>
        </AllowToggleWrapper>
        <ButtonWrapper>
          <StyledButton
            category={Category.primary}
            disabled={props.invalid}
            size={Size.medium}
            tag="button"
            text="Make your first App"
          />
        </ButtonWrapper>
      </FormBodyWrapper>
    </NewsletterContainer>
  );
});
