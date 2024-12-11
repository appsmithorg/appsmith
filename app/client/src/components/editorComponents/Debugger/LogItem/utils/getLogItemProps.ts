import type { Log } from "entities/AppsmithConsole";
import { getLogIcon } from "../../helpers";

const showToggleIcon = (e: Log) => {
  let output = !!e.state || !!e.messages;

  if (!output && e.logData && e.logData.length > 0) {
    e.logData.forEach((item) => {
      if (typeof item === "object") {
        output = true;
      }
    });
  }

  return output;
};

export const getLogItemProps = (e: Log) => {
  return {
    icon: getLogIcon(e),
    timestamp: e.timestamp,
    source: e.source,
    label: e.text,
    logData: e.logData,
    category: e.category,
    timeTaken: e.timeTaken ? `${e.timeTaken}ms` : "",
    severity: e.severity,
    text: e.text,
    state: e.state,
    id: e.source ? e.source.id : undefined,
    messages: e.messages,
    collapsible: showToggleIcon(e),
    occurrences: e.occurrenceCount || 1,
  };
};
