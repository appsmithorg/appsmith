import React from "react";
import { withKnobs } from "@storybook/addon-knobs";
import AdsText, { TextType } from "../ads/Text";

export default {
  title: "Text",
  component: AdsText,
  decorators: [withKnobs],
};

export const TextStory = () => (
  <div style={{ background: "#090707" }}>
    <AdsText type={TextType.h1}>Hi there, I am h1 element.</AdsText>

    <br />

    <AdsText type={TextType.h2}>Hi there, I am h2 element.</AdsText>

    <br />

    <AdsText type={TextType.h3}>Hi there, I am h3 element.</AdsText>

    <br />

    <AdsText type={TextType.h4}>Hi there, I am h4 element.</AdsText>

    <br />

    <AdsText type={TextType.h5}>Hi there, I am h5 element.</AdsText>

    <br />

    <AdsText type={TextType.h6}>Hi there, I am h6 element.</AdsText>

    <hr />

    <AdsText type={TextType.p1}>Hi there, I am p1 element.</AdsText>

    <br />

    <AdsText type={TextType.p2}>Hi there, I am p2 element.</AdsText>

    <br />

    <AdsText type={TextType.p3}>Hi there, I am p3 element.</AdsText>
  </div>
);
