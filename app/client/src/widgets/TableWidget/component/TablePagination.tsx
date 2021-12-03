/* eslint-disable @typescript-eslint/ban-types */
// TODO(vikcy): Fix the banned types in this file
import React from "react";
import { Icon, IconName } from "@blueprintjs/core";
import styled from "styled-components";

const PagerContainer = styled.div`
  &&& {
    height: 49px;
  }
`;
function PagerIcon(props: {
  icon: IconName;
  onClick: Function;
  className: string;
}) {
  return (
    <Icon
      className={props.className}
      icon={props.icon}
      iconSize={14}
      onClick={props.onClick as any}
      style={{
        padding: 14,
        marginTop: 5,
      }}
    />
  );
}
interface PagerProps {
  pageNo: number;
  prevPageClick: Function;
  nextPageClick: Function;
}

const PageWrapper = styled.div`
  && {
    width: 140px;
    display: flex;
    margin: 0 auto;
  }
`;

export function TablePagination(props: PagerProps) {
  return (
    <PagerContainer className={"e-control e-pager e-lib"}>
      <PageWrapper>
        <PagerIcon
          className={
            props.pageNo <= 1
              ? "e-prev e-icons e-icon-prev e-prevpagedisabled e-disable"
              : "e-prev e-icons e-icon-prev e-prevpage"
          }
          icon={"chevron-left"}
          onClick={props.prevPageClick}
        />
        <div
          className={"e-numericcontainer"}
          style={{
            marginTop: 12,
            marginLeft: 6,
          }}
        >
          <button
            className={"e-link e-numericitem e-spacing e-currentitem e-active"}
          >
            {props.pageNo}
          </button>
        </div>
        <PagerIcon
          className={"e-next e-icons e-icon-next e-nextpage"}
          icon={"chevron-right"}
          onClick={props.nextPageClick}
        />
      </PageWrapper>
    </PagerContainer>
  );
}
