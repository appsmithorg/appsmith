import { theme } from "constants/DefaultTheme";
import React from "react";
import ReactDOM from "react-dom";
import { sqlHint } from "./hintHelpers";

const hintContainerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
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
  paddingLeft: "5px",
  height: "24px",
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "center",
  flex: 1,
  lineHeight: "15px",
  letterSpacing: "-0.24px",
  fontSize: "12px",
};

const hintLabelStyles: React.CSSProperties = {
  fontStyle: "italic",
  letterSpacing: "-0.24px",
  fontWeight: "normal",
  padding: "0 10px",
  lineHeight: "13px",
  fontSize: "10px",
};

enum SQLHintType {
  unknown = "unknown",
  keyword = "keyword",
  text = "text",
  int4 = "int4",
  table = "table",
}

const SQLDataTypeToBgColor: Record<
  string,
  NonNullable<React.CSSProperties["color"]>
> = {
  unknown: theme.colors.dataTypeBg.unknown,
  keyword: theme.colors.dataTypeBg.object,
  text: theme.colors.dataTypeBg.number,
  int4: theme.colors.dataTypeBg.array,
  table: theme.colors.dataTypeBg.function,
};
function getHintDetailsFromClassName(
  text: string,
  className?: string,
): {
  hintType: string;
  iconText: string;
  iconBg: string;
} {
  switch (className) {
    case "CodeMirror-hint-table":
      const hintDataType = sqlHint.datasourceTableKeys[text];
      return hintDataType
        ? {
            hintType: hintDataType,
            iconText: hintDataType.charAt(0).toLocaleUpperCase(),
            iconBg:
              SQLDataTypeToBgColor[hintDataType] ||
              SQLDataTypeToBgColor.unknown,
          }
        : {
            hintType: SQLHintType.unknown,
            iconText: "U",
            iconBg: SQLDataTypeToBgColor.unknown,
          };

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

// Avoiding styled components since ReactDOM.render cannot directly work with it
export default function CustomHint({
  className,
  text,
}: {
  text: string;
  className?: string;
}) {
  const { hintType, iconBg, iconText } = getHintDetailsFromClassName(
    text,
    className,
  );
  return (
    <div style={hintContainerStyles}>
      <span style={getHintIconStyles(iconBg)}>{iconText}</span>
      <div style={hintStyles}>{text}</div>
      <span className="sql-hint-label" style={hintLabelStyles}>
        {hintType}
      </span>
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
