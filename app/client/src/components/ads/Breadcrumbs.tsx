import React from "react";
import styled from "styled-components";
import {
  Breadcrumbs as BPBreadcrumbs,
  Breadcrumb,
  IBreadcrumbProps,
} from "@blueprintjs/core";

interface BreadcrumbProps {
  items: IBreadcrumbProps[];
}

const renderCurrentBreadcrumb = ({ text, ...restProps }: IBreadcrumbProps) => {
  // customize rendering of last breadcrumb
  return <Breadcrumb {...restProps}>{text}</Breadcrumb>;
};

const StyledBreadcrumbs = styled(BPBreadcrumbs)`
  &.bp3-overflow-list {
    > li {
      .bp3-breadcrumb {
        font-size: 12px;
      }
    }
  }
`;

function Breadcrumbs(props: BreadcrumbProps) {
  return (
    <StyledBreadcrumbs
      currentBreadcrumbRenderer={renderCurrentBreadcrumb}
      items={props.items}
    />
  );
}

export default Breadcrumbs;
