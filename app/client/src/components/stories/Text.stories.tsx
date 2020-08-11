import React from "react";
import { withKnobs } from "@storybook/addon-knobs";
import Text, { TextType } from "../ads/Text";
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
      <Text type={TextType.h1}>Hi there, I am h1 element.</Text>
      <Text type={TextType.h2}>Hi there, I am h2 element.</Text>
      <Text type={TextType.h3}>Hi there, I am h3 element.</Text>
      <Text type={TextType.h4}>Hi there, I am h4 element.</Text>
      <Text type={TextType.h5}>Hi there, I am h5 element.</Text>
      <Text type={TextType.h6}>Hi there, I am h6 element.</Text>
    </StyledDiv>

    <br />

    <StyledDiv>
      <Text type={TextType.p1}>Hi there, I am p1 element.</Text>
      <Text type={TextType.p2}>Hi there, I am p2 element.</Text>
      <Text type={TextType.p3}>Hi there, I am p3 element.</Text>
    </StyledDiv>
  </div>
);
