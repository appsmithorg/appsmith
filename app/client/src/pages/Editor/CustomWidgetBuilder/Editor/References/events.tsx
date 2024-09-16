import React, { useCallback, useContext, useState } from "react";
import styles from "./styles.module.css";
import { Icon, Text } from "@appsmith/ads";
import {
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { CustomWidgetBuilderContext } from "../..";
import LazyCodeEditor from "components/editorComponents/LazyCodeEditor";
import styled from "styled-components";
import { CUSTOM_WIDGET_FEATURE, createMessage } from "ee/constants/messages";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

const StyledLazyCodeEditorWrapper = styled.div`
  .CodeMirror-line.CodeMirror-line {
    padding-left: 0;
  }

  & .CodeMirror.CodeMirror {
    border: none !important;
    pointer-events: none;
  }

  & .LazyCodeEditor pre {
    padding-left: 0px !important;
  }
`;

export default function Events() {
  const { events, widgetId } = useContext(CustomWidgetBuilderContext);

  const [openState, setOpenState] = useState<Record<string, boolean>>({});

  const toggleOpen = useCallback((event: string) => {
    AnalyticsUtil.logEvent("CUSTOM_WIDGET_BUILDER_REFERENCE_EVENT_OPENED", {
      widgetId: widgetId,
      eventName: event,
    });

    setOpenState((prev) => {
      return {
        ...prev,
        [event]: !prev[event],
      };
    });
  }, []);

  return (
    <div className={styles.events}>
      {events &&
        Object.keys(events)?.map((event) => {
          return (
            <div className={styles.event} key={event}>
              <div className={styles.eventName}>
                <div
                  className={styles.eventLabel}
                  onClick={() => toggleOpen(event)}
                >
                  {event}
                </div>
                <div
                  className={styles.eventControl}
                  onClick={() => toggleOpen(event)}
                >
                  <Icon
                    name={
                      openState[event] ? "arrow-down-s-line" : "arrow-up-s-line"
                    }
                    size="md"
                  />
                </div>
              </div>
              {openState[event] && (
                <StyledLazyCodeEditorWrapper className={styles.eventValue}>
                  <LazyCodeEditor
                    borderLess
                    evaluatedValue={events[event]}
                    hideEvaluatedValue
                    input={{
                      value: events[event],
                    }}
                    isReadOnly
                    mode={EditorModes.TEXT_WITH_BINDING}
                    placeholder="No action"
                    positionCursorInsideBinding
                    showCustomToolTipForHighlightedText={false}
                    showLightningMenu={false}
                    size={EditorSize.EXTENDED}
                    tabBehaviour={TabBehaviour.INDENT}
                    theme={EditorTheme.LIGHT}
                  />
                </StyledLazyCodeEditorWrapper>
              )}
            </div>
          );
        })}
      {events && Object.keys(events).length === 0 && (
        <Text
          color="#6A7585"
          renderAs="p"
          style={{
            lineHeight: "18px",
          }}
        >
          {createMessage(CUSTOM_WIDGET_FEATURE.referrences.events.emptyMessage)}
        </Text>
      )}
    </div>
  );
}
