import React from "react";
import { Severity } from "entities/AppsmithConsole";

export default function LogTimeStamp(props: {
  timestamp: string;
  severity: Severity;
}) {
  return (
    <div className={`debugger-time ${props.severity}`}>{props.timestamp}</div>
  );
}
