import React from "react";
import type { ExtraProps } from "react-markdown";

type ULProps = React.ClassAttributes<HTMLUListElement> &
  React.HTMLAttributes<HTMLUListElement> &
  ExtraProps;

export const ul = (props: ULProps) => {
  const { children } = props;

  return <ul data-component="ul">{children}</ul>;
};

type LIProps = React.ClassAttributes<HTMLLIElement> &
  React.HTMLAttributes<HTMLLIElement> &
  ExtraProps;

export const li = (props: LIProps) => {
  const { children } = props;

  return <li>{children}</li>;
};

export const ol = (props: ULProps) => {
  const { children } = props;

  return <ol data-component="ol">{children}</ol>;
};
