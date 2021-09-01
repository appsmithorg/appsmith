import React from "react";
import { boolean, select, text, withKnobs } from "@storybook/addon-knobs";
import Text, { TextType, Case, FontWeight } from "components/ads/Text";
import styled from "styled-components";
import { StoryWrapper } from "components/ads/common";

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

export function Typography() {
  return (
    <StoryWrapper style={{ display: "flex" }}>
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
    </StoryWrapper>
  );
}

function ValueWrapper(props: { type: TextType; value: string }) {
  return (
    <Text
      case={select("Case", Object.values(Case), undefined)}
      highlight={boolean("highlight", false)}
      italic={boolean("italic", false)}
      type={props.type}
      underline={boolean("underline", false)}
      weight={select("Weight", Object.values(FontWeight), undefined)}
    >
      {props.value}
    </Text>
  );
}

export function CustomizeText() {
  return (
    <StoryWrapper>
      <ValueWrapper
        type={select("type", Object.values(TextType), TextType.H1)}
        value={text("text", "Hi There I am Earth")}
      />
    </StoryWrapper>
  );
}
