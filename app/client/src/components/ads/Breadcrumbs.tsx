import React from "react";

import {
  Breadcrumbs as BPBreadcrumbs,
  Breadcrumb,
  IBreadcrumbProps,
} from "@blueprintjs/core";

const BREADCRUMBS: IBreadcrumbProps[] = [
  { href: "/applications", text: "Homepage" },
  { href: "/settings/general", text: "Settings" },
];

const renderCurrentBreadcrumb = ({ text, ...restProps }: IBreadcrumbProps) => {
  // customize rendering of last breadcrumb
  return <Breadcrumb {...restProps}>{text}</Breadcrumb>;
};

function Breadcrumbs() {
  return (
    <BPBreadcrumbs
      currentBreadcrumbRenderer={renderCurrentBreadcrumb}
      items={BREADCRUMBS}
    />
  );
}

export default Breadcrumbs;
