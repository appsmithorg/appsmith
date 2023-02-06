import React from "react";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { Message, Severity } from "entities/AppsmithConsole";

export default function LogTimeStamp(props: {
  timestamp: string;
  severity: Severity;
  logType?: LOG_TYPE;
  messages?: Message[];
}) {
  return (
    <div style={{ lineHeight: "14px" }}>
      {props.logType &&
        props.logType !== LOG_TYPE.LINT_ERROR &&
        props.messages &&
        props.messages[0].message.name !== "SyntaxError" && (
          <span className={`debugger-time ${props.severity}`}>
            {props.timestamp}
          </span>
        )}
    </div>
  );
}
