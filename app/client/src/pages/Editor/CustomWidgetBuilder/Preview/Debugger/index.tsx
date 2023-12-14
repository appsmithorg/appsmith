import React, { useContext } from "react";
import { Tabs, TabsList, Tab, TabPanel, Icon } from "design-system";
import DebuggerItem from "./debuggerItem";
import styles from "./styles.module.css";
import Counter from "./counter";
import useLocalStorageState from "utils/hooks/useLocalStorageState";
import { CustomWidgetBuilderContext } from "../..";

const LOCAL_STORAGE_KEYS_IS_DEBUGGER_OPEN =
  "custom-widget-builder-context-state-is-debugger-open";

export default function Debugger() {
  const [open, setOpen] = useLocalStorageState(
    LOCAL_STORAGE_KEYS_IS_DEBUGGER_OPEN,
    false,
  );

  const { clearDegbuggerLogs, debuggerLogs } = useContext(
    CustomWidgetBuilderContext,
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.debuggerActions}>
        <Counter
          error={debuggerLogs?.filter((d) => d.type === "error").length || 0}
          log={debuggerLogs?.filter((d) => d.type === "log").length || 0}
          onClick={() => setOpen(!open)}
          warn={debuggerLogs?.filter((d) => d.type === "warn").length || 0}
        />
        <Icon
          name="cancel"
          onClick={() => clearDegbuggerLogs?.()}
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
      <Tabs value={"Debugger"}>
        <TabsList className={styles.debuggerTab} onClick={() => setOpen(!open)}>
          <Tab key="Debugger" value="Debugger">
            Console
          </Tab>
        </TabsList>
        {open && (
          <TabPanel
            className={styles.debuggerBody}
            key="Debugger"
            value="Debugger"
          >
            {debuggerLogs?.length ? (
              debuggerLogs?.map((log, index) => (
                <DebuggerItem args={log.args} key={index} type={log.type} />
              ))
            ) : (
              <div className={styles.debuggerEmptyContainer}>
                <div className={styles.debuggerEmptyIcon}>
                  <Icon name="bug-line" size="lg" />
                </div>
                <div className={styles.debuggerEmpty}>
                  Errors and logs will appear here
                </div>
              </div>
            )}
          </TabPanel>
        )}
      </Tabs>
    </div>
  );
}
