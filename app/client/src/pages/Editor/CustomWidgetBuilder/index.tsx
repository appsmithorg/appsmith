import React, { useCallback, useEffect, useMemo, useState } from "react";
import Header from "./header";
import styles from "./styles.module.css";
import Preview from "./Preview";
import {
  CUSTOM_WIDGET_BUILDER_EVENTS,
  DEFAULT_CONTEXT_VALUE,
  LOCAL_STORAGE_KEYS_IS_REFERENCE_OPEN,
  LOCAL_STORAGE_KEYS_SELECTED_LAYOUT,
} from "./contants";
import { Spinner } from "design-system";
import history from "utils/history";
import useLocalStorageState from "utils/hooks/useLocalStorageState";
import Editor from "./Editor";
import {
  DebuggerLogType,
  type CustomWidgetBuilderContextFunctionType,
  type CustomWidgetBuilderContextType,
  type CustomWidgetBuilderContextValueType,
  type DebuggerLog,
  type SrcDoc,
} from "./types";
import { compileSrcDoc } from "./utility";

export const CustomWidgetBuilderContext = React.createContext<
  Partial<CustomWidgetBuilderContextType>
>({});

let connectionTimeout: number;

export default function CustomWidgetBuilder() {
  const [loading, setLoading] = useState(true);

  const [isReferenceOpen, setIsReferenceOpen] = useLocalStorageState<boolean>(
    LOCAL_STORAGE_KEYS_IS_REFERENCE_OPEN,
    true,
  );

  const [selectedLayout, setSelectedLayout] = useLocalStorageState<string>(
    LOCAL_STORAGE_KEYS_SELECTED_LAYOUT,
    "tabs",
  );

  const [contextValue, setContextValue] =
    useState<CustomWidgetBuilderContextValueType>(DEFAULT_CONTEXT_VALUE);

  useEffect(() => {
    const result = compileSrcDoc(contextValue.uncompiledSrcDoc);

    setContextValue((prev) => {
      return {
        ...prev,
        srcDoc: result.code,
      };
    });

    if (contextValue.lastSaved) {
      window.parent.postMessage(
        {
          type: CUSTOM_WIDGET_BUILDER_EVENTS.UPDATE_SRCDOC,
          srcDoc: result.code,
          uncompiledSrcDoc: contextValue.uncompiledSrcDoc,
        },
        "*",
      );
    }

    const compileLogs: DebuggerLog[] = [];

    if (result.errors.length) {
      compileLogs.push({
        type: DebuggerLogType.ERROR,
        args: result.errors,
      });
    }

    if (result.warnings.length) {
      compileLogs.push({
        type:  DebuggerLogType.WARN,
        args: result.warnings,
      });
    }

    setContextValue((prev) => ({
      ...prev,
      debuggerLogs: [...prev.debuggerLogs, ...compileLogs],
    }));
  }, [contextValue.uncompiledSrcDoc, contextValue.lastSaved]);

  const replay = useCallback(() => {
    setContextValue((prev) => {
      return {
        ...prev,
        key: Math.random(),
      };
    });
  }, []);

  const contextFunctions: CustomWidgetBuilderContextFunctionType = useMemo(
    () => ({
      toggleReference: () => {
        setIsReferenceOpen(!isReferenceOpen);
      },
      selectLayout: (layout) => {
        setSelectedLayout(layout);
      },
      close: () => {
        window.parent.focus();
        window.close();
      },
      bulkUpdate: (uncompiledSrcDoc: SrcDoc) => {
        setContextValue((prev) => {
          return {
            ...prev,
            uncompiledSrcDoc,
            lastSaved: Date.now(),
          };
        });
      },
      update: (editor, value) => {
        setContextValue((prev) => {
          return {
            ...prev,
            uncompiledSrcDoc: {
              ...prev.uncompiledSrcDoc,
              [editor]: value,
            },
            lastSaved: Date.now(),
          };
        });
      },
      updateModel: (model: Record<string, unknown>) => {
        setContextValue((prev) => {
          return {
            ...prev,
            model: {
              ...prev.model,
              ...model,
            },
          };
        });
      },
      updateDebuggerLogs: (log: DebuggerLog) => {
        setContextValue((prev) => {
          return {
            ...prev,
            debuggerLogs: [...prev.debuggerLogs, log],
          };
        });
      },
      clearDegbuggerLogs: () => {
        setContextValue((prev) => {
          return {
            ...prev,
            debuggerLogs: [],
          };
        });
      },
    }),
    [
      contextValue.uncompiledSrcDoc,
      setIsReferenceOpen,
      isReferenceOpen,
      setSelectedLayout,
      selectedLayout,
    ],
  );

  const context = useMemo(
    () => ({
      ...contextValue,
      isReferenceOpen,
      selectedLayout,
      ...contextFunctions,
    }),
    [contextValue, contextFunctions, isReferenceOpen, selectedLayout],
  );

  useEffect(replay, [contextValue.srcDoc]);

  useEffect(() => {
    window.addEventListener("message", (event: any) => {
      switch (event.data.type) {
        case CUSTOM_WIDGET_BUILDER_EVENTS.READY_ACK:
          connectionTimeout && clearTimeout(connectionTimeout);
          setContextValue((prev) => {
            return {
              ...prev,
              name: event.data.name,
              srcDoc: event.data.srcDoc,
              uncompiledSrcDoc: event.data.uncompiledSrcDoc,
              initialSrcDoc: event.data.uncompiledSrcDoc,
              model: event.data.model,
              events: event.data.events,
            };
          });
          setLoading(false);
          break;
        case CUSTOM_WIDGET_BUILDER_EVENTS.UPDATE_REFERENCES:
          setContextValue((prev) => {
            return {
              ...prev,
              name: event.data.name,
              model: event.data.model,
              events: event.data.events,
            };
          });
          replay();
          break;
      }
    });

    window.parent.postMessage(
      {
        type: CUSTOM_WIDGET_BUILDER_EVENTS.READY,
      },
      "*",
    );

    window.addEventListener("beforeunload", () => {
      window.parent.postMessage(
        {
          type: CUSTOM_WIDGET_BUILDER_EVENTS.DISCONNECTED,
        },
        "*",
      );
    });

    connectionTimeout = setTimeout(() => {
      history.replace(window.location.pathname.replace("/builder", ""));
    }, 2000);
  }, []);

  return (
    <CustomWidgetBuilderContext.Provider value={context}>
      <Header />
      {loading ? (
        <Spinner className={styles.loader} size="lg" />
      ) : (
        <div className={styles.content}>
          <Preview />
          <Editor />
        </div>
      )}
    </CustomWidgetBuilderContext.Provider>
  );
}

export { Header as CustomWidgetBuilderHeader };
