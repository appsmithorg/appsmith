import React from "react";
import { Icon } from "@appsmith/ads";
import styles from "./styles.module.css";
import HelpDropdown from "./helpDropdown";
import { DebuggerLogType, type DebuggerLog } from "../../types";
import ObjectView from "./objectView";
import styled from "styled-components";

const StyledSpan = styled.span<{ type: string }>`
  color: ${(props) => {
    switch (props.type) {
      case "string":
        return "hsl(30,77%,40%)";
      case "number":
        return "#1659df";
      default:
        return "#063289";
    }
  }};
`;

const getIcon = (type: DebuggerLog["type"]) => {
  switch (type) {
    case DebuggerLogType.ERROR:
      return (
        <Icon
          name="close-circle"
          size="md"
          style={{
            color: "var(--ads-v2-color-red-600)",
          }}
        />
      );
    case DebuggerLogType.WARN:
      return (
        <Icon
          name="alert-fill"
          size="md"
          style={{
            color: "var(--ads-v2-color-yellow-600)",
          }}
        />
      );
    case DebuggerLogType.LOG:
      return <Icon name="snippet" size="md" />;
    case DebuggerLogType.INFO:
      return <Icon name="info" size="md" />;
    default:
      return <Icon name="snippet" size="md" />;
  }
};

const getContent = (type: string, args: DebuggerLog["args"]) => {
  return args.map((d, i) => {
    if (d.message instanceof Object) {
      return <ObjectView key={i} value={d.message} />;
    } else if (type === "log") {
      return (
        <StyledSpan key={i} type={typeof d.message}>
          {typeof d.message === "number"
            ? d.message
            : JSON.stringify(d.message)}
        </StyledSpan>
      );
    } else {
      return <span key={i}>{d.message}</span>;
    }
  });
};

const getBackgroundColor = (type: DebuggerLog["type"]) => {
  switch (type) {
    case DebuggerLogType.ERROR:
      return "var(--ads-v2-color-red-50)";
    case DebuggerLogType.WARN:
      return "var(--ads-v2-color-yellow-100)";
    default:
      return "#fff";
  }
};

export default function DebuggerItem(props: DebuggerLog) {
  const { args, type } = props;

  return (
    <div
      className={styles.debuggerItem}
      style={{
        background: getBackgroundColor(props.type),
      }}
    >
      <div className={styles.debuggerItemIcon}>{getIcon(props.type)}</div>
      <div className={styles.debuggerItemMessage}>{getContent(type, args)}</div>
      {type === DebuggerLogType.ERROR && (
        <div className={styles.debuggerItemHelp}>
          <HelpDropdown args={args} type={type} />
        </div>
      )}
    </div>
  );
}
