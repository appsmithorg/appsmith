import React from "react";
import { Link } from "@appsmith/wds";
import type { ExtraProps } from "react-markdown";

type LinkProps = React.ClassAttributes<HTMLAnchorElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement> &
  ExtraProps;

export const a = (props: LinkProps) => {
  const { children, href } = props;

  return (
    <Link data-component="a" href={href} rel="noreferrer" target="_blank">
      {children}
    </Link>
  );
};
