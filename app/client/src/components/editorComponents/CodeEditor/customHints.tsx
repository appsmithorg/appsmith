import React from "react";
import ReactDOM from "react-dom";

const hintContainerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  fontSize: "10px",
  width: "100%",
};
const getHintIconStyles = (bgColor: string): React.CSSProperties => {
  return {
    background: bgColor,
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "12px",
    height: "12px",
    marginLeft: "3px",
    color: "#858282",
    lineHeight: "12px",
  };
};

const hintStyles: React.CSSProperties = {
  paddingLeft: "4px",
  height: "24px",
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "center",
  flex: 1,
  lineHeight: "15px",
  letterSpacing: "-0.24px",
};

const hintLabelStyles: React.CSSProperties = {
  fontStyle: "italic",
  letterSpacing: "-0.24px",
  fontWeight: "normal",
  padding: "0 10px",
};

enum SQLHintType {
  unknown = "unknown",
  keyword = "keyword",
  table = "table",
}
function getHintDetailsFromClassName(className?: string): {
  hintType: SQLHintType;
  iconText: string;
  iconBg: string;
} {
  switch (className) {
    case "CodeMirror-hint-table":
      return { hintType: SQLHintType.table, iconText: "T", iconBg: "#BDB2FF" };
    case "CodeMirror-hint-keyword":
      return {
        hintType: SQLHintType.keyword,
        iconText: "K",
        iconBg: "#FFD6A5",
      };
    default:
      return { hintType: SQLHintType.unknown, iconText: "U", iconBg: "#4bb" };
  }
}

export default function CustomHint({
  className,
  text,
}: {
  text: string;
  className?: string;
}) {
  const { hintType, iconBg, iconText } = getHintDetailsFromClassName(className);
  return (
    <div style={hintContainerStyles}>
      <span style={getHintIconStyles(iconBg)}>{iconText}</span>
      <div style={hintStyles}>{text}</div>
      <span style={hintLabelStyles}>{hintType}</span>
    </div>
  );
}

export function renderHint(
  LiElement: HTMLLIElement,
  text: string,
  className?: string,
) {
  ReactDOM.render(<CustomHint className={className} text={text} />, LiElement);
}
