import React, { ReactNode } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import Icon from "./Icon";

export interface BreadcrumbsProps {
  items: {
    href: string;
    text: string;
  }[];
}
export interface BreadcrumbProps {
  children: ReactNode;
}

export const StyledBreadcrumbList = styled.ol`
  list-style: none;
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #716e6e;
  margin-bottom: 23px;

  .breadcrumb-separator {
    color: #716e6e;
    margin: auto 6px;
    user-select: none;
  }
`;

function BreadcrumbSeparator({ children, ...props }: { children: ReactNode }) {
  return (
    <li className="breadcrumb-separator" {...props}>
      {children}
    </li>
  );
}

function BreadcrumbItem({ children, ...props }: { children: ReactNode }) {
  return (
    <li className="breadcrumb-item" {...props}>
      {children}
    </li>
  );
}

function BreadcrumbList(props: BreadcrumbProps) {
  let children = React.Children.toArray(props.children);

  children = children.map((child, index) => (
    <BreadcrumbItem key={`breadcrumb_item${index}`}>{child}</BreadcrumbItem>
  ));

  const lastIndex = children.length - 1;

  const childrenNew = children.reduce((acc: ReactNode[], child, index) => {
    const notLast = index < lastIndex;

    if (notLast) {
      acc.push(
        child,
        <BreadcrumbSeparator key={`breadcrumb_sep${index}`}>
          <Icon name="right-arrow-2" />
        </BreadcrumbSeparator>,
      );
    } else {
      acc.push(child);
    }
    return acc;
  }, []);

  return (
    <StyledBreadcrumbList className="t--breadcrumb-list">
      {childrenNew}
    </StyledBreadcrumbList>
  );
}

function Breadcrumbs(props: BreadcrumbsProps) {
  return (
    <BreadcrumbList>
      {props.items.map(({ href, text }) => (
        <Link className="t--breadcrumb-item" key={href} to={href}>
          {text}
        </Link>
      ))}
    </BreadcrumbList>
  );
}

export default Breadcrumbs;
