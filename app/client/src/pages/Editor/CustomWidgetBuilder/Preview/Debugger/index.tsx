import React, { useState } from "react";
import { Tabs, TabsList, Tab, TabPanel, Icon } from "design-system";
import type { ConsoleItemProps } from "./consoleItem";
import ConsoleItem from "./consoleItem";
import styles from "./styles.module.css";
import Counter from "./counter";

interface Props {
  logs: ConsoleItemProps[];
  clear: () => void;
}

export default function Debugger(props: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.wrapper}>
      <div className={styles.consoleActions}>
        <Counter
          error={props.logs.filter((d) => d.type === "error").length}
          log={props.logs.filter((d) => d.type === "log").length}
          onClick={() => setOpen(!open)}
          warn={props.logs.filter((d) => d.type === "warn").length}
        />
        <Icon
          name="cancel"
          onClick={() => props.clear()}
          size="md"
          style={{ cursor: "pointer" }}
        />
        <Icon
          name={open ? "arrow-down-s-line" : "arrow-up-s-line"}
          onClick={() => setOpen(!open)}
          size="lg"
          style={{ cursor: "pointer" }}
        />
      </div>
      <Tabs value={"Console"}>
        <TabsList className={styles.consoleTab} onClick={() => setOpen(!open)}>
          <Tab key="Console" value="Console">
            Console
          </Tab>
        </TabsList>
        {open && (
          <TabPanel
            className={styles.consoleBody}
            key="Console"
            value="Console"
          >
            {props.logs.map((log, index) => (
              <ConsoleItem args={log.args} key={index} type={log.type} />
            ))}
          </TabPanel>
        )}
      </Tabs>
    </div>
  );
}
