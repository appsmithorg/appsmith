import React, { useCallback, useContext, useEffect } from "react";
import { Tabs, TabsList, Tab, TabPanel, Icon, Tooltip } from "@appsmith/ads";
import DebuggerItem from "./debuggerItem";
import styles from "./styles.module.css";
import Counter from "./counter";
import useLocalStorageState from "utils/hooks/useLocalStorageState";
import { CustomWidgetBuilderContext } from "../..";
import { DebuggerLogType } from "../../types";
import BugIcon from "../Debugger/icon.svg";
import { CUSTOM_WIDGET_FEATURE, createMessage } from "ee/constants/messages";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

const LOCAL_STORAGE_KEYS_IS_DEBUGGER_OPEN =
  "custom-widget-builder-context-state-is-debugger-open";

export default function Debugger() {
  const scrollToRef = React.useRef<HTMLDivElement>(null);

  const [open, setOpen] = useLocalStorageState(
    LOCAL_STORAGE_KEYS_IS_DEBUGGER_OPEN,
    false,
  );

  const { clearDegbuggerLogs, debuggerLogs, widgetId } = useContext(
    CustomWidgetBuilderContext,
  );

  useEffect(() => {
    scrollToRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [debuggerLogs]);

  const toggle = useCallback(() => {
    setOpen(!open);
    AnalyticsUtil.logEvent(
      "CUSTOM_WIDGET_BUILDER_DEBUGGER_VISIBILITY_CHANGED",
      {
        widgetId: widgetId,
        visible: !open,
      },
    );
  }, [open]);

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
          onClick={() => toggle()}
          warn={
            debuggerLogs?.filter((d) => d.type === DebuggerLogType.WARN)
              .length || 0
          }
        />
        <Tooltip content="Clear console">
          <Icon
            name="forbid-line"
            onClick={() => {
              clearDegbuggerLogs?.();
              AnalyticsUtil.logEvent("CUSTOM_WIDGET_BUILDER_DEBUGGER_CLEARED", {
                widgetId: widgetId,
              });
            }}
            size="md"
            style={{ cursor: "pointer" }}
          />
        </Tooltip>
        <Tooltip content={open ? "Close console" : "Open console"}>
          <Icon
            name={open ? "arrow-down-s-line" : "arrow-up-s-line"}
            onClick={() => toggle()}
            size="lg"
            style={{ cursor: "pointer" }}
          />
        </Tooltip>
      </div>
      <Tabs value={"Debugger"}>
        <TabsList className={styles.debuggerTab} onClick={() => toggle()}>
          <Tab key="Debugger" value="Debugger">
            {createMessage(CUSTOM_WIDGET_FEATURE.debugger.title)}
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
                  {createMessage(CUSTOM_WIDGET_FEATURE.debugger.emptyMessage)}
                </div>
              </div>
            )}
            <div ref={scrollToRef} />
          </TabPanel>
        )}
      </Tabs>
    </div>
  );
}
