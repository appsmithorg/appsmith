/* eslint-disable no-console */
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import React from "react";
import { useDispatch } from "react-redux";

export function CodeBlock(props: any) {
  const dispatch = useDispatch();

  const text = () => {
    let tags = [];
    if (props.conflict) {
      const tag1 = preTagWithText(props.original, "#FFEBE9", props, "original");
      const tag2 = preTagWithText(props.text, "#E6FFEC", props, "current");
      tags = [tag1, tag2];
    } else {
      const tag = preTagWithText(props.text, "white", props, "none");
      tags = [tag];
    }
    return (
      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        {props.lineNumber && (
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "13px",
              marginRight: "8px",
            }}
          >
            {props.lineNumber}
          </div>
        )}
        <div style={{ flexShrink: 2 }}>
          {props.conflict ? (
            <>
              <span>{tags[0]}</span>
              <div style={{ display: "flex" }}>
                <span
                  onClick={() => acceptCurrentLine(props)}
                  style={{
                    position: "relative",
                    left: "-12px",
                    cursor: "pointer",
                  }}
                >
                  ✅
                </span>
                <span>{tags[1]}</span>
              </div>
            </>
          ) : (
            <span>{tags[0]}</span>
          )}
        </div>
      </div>
    );
  };

  const acceptCurrentLine = (selected: any) => {
    const elText = document.getElementById(
      `${selected.id}-current`,
    )?.textContent;
    // const textArr =
    //   elText && elText !== selected.text
    //     ? elText.split("\n")
    //     : selected.text.split("\n");

    // const res = textArr.map((curr: any, index: number) => {
    //   const lineNumber = parseInt(selected.lineNumber) + index;
    //   const id = `${selected.id.split("-")[0]}-${lineNumber}`;
    //   return {
    //     conflict: false,
    //     lineNumber,
    //     text: curr,
    //     id,
    //   };
    // });

    const text = elText && elText !== selected.text ? elText : selected.text;
    const id = `${selected.id.split("-")[0]}-${selected.lineNumber}`;
    const res = [
      {
        conflict: false,
        lineNumber: selected.lineNumber,
        text,
        id,
      },
    ];

    const filename = selected.name;
    dispatch({
      type: ReduxActionTypes.ADD_TO_RESOLVED_CONFLICTS,
      payload: {
        file: filename,
        value: res,
      },
    });
  };

  const clickListenerFunction = (props: any) => {
    console.log("click listener called", props);
  };

  const preTagWithText = (text: any, color: any, props: any, type: any) => {
    return (
      <pre
        contentEditable="true"
        id={`${props.id}-${type}`}
        onClick={() => clickListenerFunction(props)}
        style={{ margin: "0px", backgroundColor: color }}
      >
        {text}
      </pre>
    );
  };

  return (
    <div>{text()}</div>

    // (<pre style={{margin: "5px", ...styles, backgroundColor:  backgroundColor() }} contenteditable="true">{props.text}</pre>)
  );
}

export function CodeRenderer(props: any) {
  const textBlocks = () => {
    const blocks = [];
    const blocksToIterate = props.blocks ?? [];
    for (const block of blocksToIterate) {
      blocks.push(<CodeBlock {...block} name={props.name} />);
    }
    return blocks;
  };

  return (
    <div>
      {props.name}
      <div
        style={{
          height: "400px",
          overflow: "scroll",
          border: "1px solid black",
        }}
      >
        {textBlocks()}
      </div>
    </div>
  );
}
