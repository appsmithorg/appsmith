import React from "react";

export function CodeBlock(props) {
  const styles = {
    "[codeEditable]": {
      outline: "none",
    },
  };

  const text = () => {
    if (props.conflict) {
      const tag1 = preTagWithText(props.original, "#FFEBE9");
      const tag2 = preTagWithText(props.text, "#E6FFEC");
      return (
        <div>
          {tag1}
          {tag2}
        </div>
      );
    } else {
      const tag = preTagWithText(props.text, "white");
      return <div>{tag}</div>;
    }
  };

  const preTagWithText = (text, color) => {
    return (
      <pre
        contentEditable="true"
        style={{ margin: "0px", ...styles, backgroundColor: color }}
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

export function CodeRenderer(props) {
  const textBlocks = () => {
    let blocks = [];
    let blocksToIterate = props.blocks ?? [];
    for (const block of blocksToIterate) {
      blocks.push(<CodeBlock {...block} />);
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
