import React, { useContext } from "react";
import { Tabs, TabsList, Tab, TabPanel, Icon, Tooltip } from "design-system";
import DebuggerItem from "./debuggerItem";
import styles from "./styles.module.css";
import Counter from "./counter";
import useLocalStorageState from "utils/hooks/useLocalStorageState";
import { CustomWidgetBuilderContext } from "../..";
import { DebuggerLogType } from "../../types";
import BugIcon from "../Debugger/icon.svg";

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
          error={
            debuggerLogs?.filter((d) => d.type === DebuggerLogType.ERROR)
              .length || 0
          }
          log={
            debuggerLogs?.filter((d) => d.type === DebuggerLogType.LOG)
              .length || 0
          }
          onClick={() => setOpen(!open)}
          warn={
            debuggerLogs?.filter((d) => d.type === DebuggerLogType.WARN)
              .length || 0
          }
        />
        <Tooltip content="clear console">
          <Icon
            name="forbid-line"
            onClick={() => clearDegbuggerLogs?.()}
            size="md"
            style={{ cursor: "pointer" }}
          />
        </Tooltip>
        <Tooltip content={open ? "close console" : "open console"}>
          <Icon
            name={open ? "arrow-down-s-line" : "arrow-up-s-line"}
            onClick={() => setOpen(!open)}
            size="lg"
            style={{ cursor: "pointer" }}
          />
        </Tooltip>
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
                  <img src={BugIcon} />
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
