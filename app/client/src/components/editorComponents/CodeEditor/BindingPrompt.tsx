import React, { Children, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import _ from "lodash";
import { Popover, Position } from "@blueprintjs/core";
import Popper from "pages/Editor/Popper";

const Wrapper = styled.div`
  position: relative;
  flex: 1;
  height: 100%;
`;

const BindingPrompt = (props: any) => {
  const promptRef = useRef<HTMLDivElement>(null);
  let yOffset = 15;

  if (promptRef.current) {
    const boundingRect = promptRef.current.getBoundingClientRect();
    yOffset = boundingRect.height;
  }

  return (
    <span
      ref={promptRef}
      style={{
        padding: "8px",
        fontSize: "12px",
        color: "#A2A6A8",
        zIndex: 1000,
        borderRadius: "2px",
        // display: "flex",
        backgroundColor: "#23292E",
        position: "absolute",
        bottom: `-${yOffset}px`,
        width: "100%",
        lineHeight: "13px",
        visibility: promptRef.current ? "visible" : "hidden",
      }}
    >
      Type{" "}
      <span
        style={{
          color: "white",
          backgroundColor: "#F3672A",
          borderRadius: "2px",
          padding: "2px",
          margin: "0px 2px",
        }}
      >
        {"{{"}
      </span>{" "}
      to see a list of variables
    </span>
  );
};

export default BindingPrompt;
