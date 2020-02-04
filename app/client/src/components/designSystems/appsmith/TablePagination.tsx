import React from "react";
import { Icon, IconName } from "@blueprintjs/core";
import styled from "styled-components";

const PagerContainer = styled.div<{
  visible: boolean;
}>`
  &&&&& {
    height: 49px;
    display: ${props => (props.visible ? "flex" : "none")};
  }
`;
function PagerIcon(props: { icon: IconName; onClick: Function }) {
  return (
    <Icon
      className={"e-next e-icons e-icon-next e-nextpage"}
      style={{
        padding: 14,
        marginTop: 5,
      }}
      icon={props.icon}
      iconSize={14}
      onClick={props.onClick as any}
    ></Icon>
  );
}
interface PagerProps {
  pageNo: number;
  prevPageClick: Function;
  nextPageClick: Function;
  visible: boolean;
}

const PageWrapper = styled.div`
  &&&&& {
    width: 140px;
    display: flex;
    margin: 0 auto;
  }
`;

export function TablePagination(props: PagerProps) {
  return (
    <PagerContainer
      className={"e-control e-pager e-lib"}
      visible={props.visible}
    >
      <PageWrapper>
        <PagerIcon
          icon={"chevron-left"}
          onClick={props.prevPageClick}
        ></PagerIcon>
        <div
          className={"e-numericcontainer"}
          style={{
            marginTop: 12,
            marginLeft: 6,
          }}
        >
          <a
            className={"e-link e-numericitem e-spacing e-currentitem e-active"}
          >
            {props.pageNo}
          </a>
        </div>
        <PagerIcon
          icon={"chevron-right"}
          onClick={props.nextPageClick}
        ></PagerIcon>
      </PageWrapper>
    </PagerContainer>
  );
}
