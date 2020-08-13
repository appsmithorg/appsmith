import React from "react";
import { withKnobs } from "@storybook/addon-knobs";
import { StyledText, TextType } from "../ads/Text";
import styled from "styled-components";

export default {
  title: "Text",
  component: Text,
  decorators: [withKnobs],
};

const StyledDiv = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-right: 50px;

  span {
    align-self: left;
    margin-bottom: 10px;
  }
`;

export const TextStory = () => (
  <div style={{ padding: "20px", display: "flex" }}>
    <StyledDiv>
      <StyledText type={TextType.H1}>Hi there, I am h1 element.</StyledText>
      <StyledText type={TextType.H2}>Hi there, I am h2 element.</StyledText>
      <StyledText type={TextType.H3}>Hi there, I am h3 element.</StyledText>
      <StyledText type={TextType.H4}>Hi there, I am h4 element.</StyledText>
      <StyledText type={TextType.H5}>Hi there, I am h5 element.</StyledText>
      <StyledText type={TextType.H6}>Hi there, I am h6 element.</StyledText>
    </StyledDiv>

    <br />

    <StyledDiv>
      <StyledText type={TextType.P1}>Hi there, I am p1 element.</StyledText>
      <StyledText type={TextType.P2}>Hi there, I am p2 element.</StyledText>
      <StyledText type={TextType.P3}>Hi there, I am p3 element.</StyledText>
    </StyledDiv>
  </div>
);
