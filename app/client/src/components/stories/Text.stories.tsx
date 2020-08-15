import React from "react";
import { boolean, select, text, withKnobs } from "@storybook/addon-knobs";
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

export const Typography = () => (
  <div style={{ padding: "20px", display: "flex" }}>
    <StyledDiv>
      <Text type={TextType.H1}>Hi there, I am h1 element.</Text>
      <Text type={TextType.H2}>Hi there, I am h2 element.</Text>
      <Text type={TextType.H3}>Hi there, I am h3 element.</Text>
      <Text type={TextType.H4}>Hi there, I am h4 element.</Text>
      <Text type={TextType.H5}>Hi there, I am h5 element.</Text>
      <Text type={TextType.H6}>Hi there, I am h6 element.</Text>
    </StyledDiv>

    <br />

    <StyledDiv>
      <Text type={TextType.P1}>Hi there, I am p1 element.</Text>
      <Text type={TextType.P2}>Hi there, I am p2 element.</Text>
      <Text type={TextType.P3}>Hi there, I am p3 element.</Text>
    </StyledDiv>
  </div>
);

const ValueWrapper = (props: { type: TextType; value: string }) => (
  <Text
    type={props.type}
    underline={boolean("underline", false)}
    italic={boolean("italic", false)}
  >
    {props.value}
  </Text>
);

export const SingleText = () => (
  <ValueWrapper
    type={select(
      "type",
      [
        TextType.H1,
        TextType.H2,
        TextType.H3,
        TextType.H4,
        TextType.H5,
        TextType.H6,
        TextType.P1,
        TextType.P2,
        TextType.P3,
      ],
      TextType.H1,
    )}
    value={text("text", "Hi There I am Earth")}
  />
);
