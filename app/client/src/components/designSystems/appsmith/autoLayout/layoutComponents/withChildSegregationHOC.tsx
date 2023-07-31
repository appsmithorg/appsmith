import React from "react";
import type { LayoutComponentProps } from "utils/autoLayout/autoLayoutTypes";

const withChildSegregationHOC = (Layout: any, props: LayoutComponentProps) => {
  // const { children, rendersWidgets } = props;
  // if (rendersWidgets) return <Layout {...props} />;
  // const layout: LayoutComponentProps[] = props.layout as LayoutComponentProps[];
  // if (layout && layout.length > 1) {

  // }
  return <Layout {...props} />;
};

export default withChildSegregationHOC;
