import React, { useRef, useState, useEffect } from "react";
import styled from "styled-components";

const CollapseContainer = styled.div`
  overflow: hidden;
  transition: all ease 0.1s;
`;

const CollapseContent = styled.div``;

const Collapsible = (props: any) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(contentRef?.current?.scrollHeight || 0);

  useEffect(() => {
    const resizeObj = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setHeight(rect.height);
    });

    if (
      props?.isOpen &&
      contentRef.current &&
      contentRef.current?.children[0]
    ) {
      resizeObj.observe(contentRef.current?.children[0]);
    }
    return () => {
      if (
        props?.isOpen &&
        contentRef.current &&
        contentRef.current?.children[0]
      ) {
        resizeObj.unobserve(contentRef.current?.children[0]);
      }
    };
  }, [contentRef.current, props?.isOpen]);

  return (
    <CollapseContainer
      ref={contentRef}
      style={props?.isOpen ? { height: `${height + 5}px` } : { height: "0px" }}
    >
      {props?.isOpen && <CollapseContent>{props.children}</CollapseContent>}
    </CollapseContainer>
  );
};

export default Collapsible;
