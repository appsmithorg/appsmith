import React from "react";
import { Icon } from "design-system";
import styles from "./styles.module.css";
import HelpDropdown from "./helpDropdown";

export interface ConsoleItemProps {
  type: string;
  args: unknown[];
}

const getIcon = (type: ConsoleItemProps["type"]) => {
  switch (type) {
    case "error":
      return (
        <Icon
          name="close-circle"
          size="md"
          style={{
            color: "var(--ads-v2-color-red-600)",
          }}
        />
      );
    case "warn":
      return (
        <Icon
          name="alert-fill"
          size="md"
          style={{
            color: "var(--ads-v2-color-yellow-600)",
          }}
        />
      );
    case "log":
      return <Icon name="snippet" size="md" />;
    default:
      return <Icon name="snippet" size="md" />;
  }
};

const getContent = (type: string, args: unknown[]) => {
  return args.reduce((prev: string, cur) => {
    return prev + " " + cur?.toString?.();
  }, "");
};

const getBackgroundColor = (type: ConsoleItemProps["type"]) => {
  switch (type) {
    case "error":
      return "var(--ads-v2-color-red-50)";
    case "warn":
      return "var(--ads-v2-color-yellow-100)";
    default:
      return "#fff";
  }
};

export default function ConsoleItem(props: ConsoleItemProps) {
  const { args, type } = props;

  return (
    <div
      className={styles.consoleItem}
      style={{
        background: getBackgroundColor(props.type),
      }}
    >
      <div className={styles.consoleItemIcon}>{getIcon(props.type)}</div>
      <div className={styles.consoleItemMessage}>{getContent(type, args)}</div>
      {type === "error" && args.length === 1 && (
        <div className={styles.consoleItemHelp}>
          <HelpDropdown args={args} type={type} />
        </div>
      )}
    </div>
  );
}
