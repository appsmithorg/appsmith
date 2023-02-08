import React from "react";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { Message, Severity } from "entities/AppsmithConsole";

export default function LogTimeStamp(props: {
  timestamp: string;
  severity: Severity;
}) {
  return (
    <div className={`debugger-time ${props.severity}`}>{props.timestamp}</div>
  );
}
