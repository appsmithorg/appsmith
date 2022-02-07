import React from "react";
import LargeTemplate from "./LargeTemplate";
import SmallTemplate from "./SmallTemplate";

type Template = {
  description: string;
  id: number;
};

export interface TemplateProps {
  template: Template;
  size?: string;
}

const Template = (props: TemplateProps) => {
  if (props.size) {
    return <LargeTemplate {...props} />;
  } else {
    return <SmallTemplate {...props} />;
  }
};

export default Template;
