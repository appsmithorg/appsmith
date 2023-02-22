import React from "react";
import { Severity } from "entities/AppsmithConsole";

// This component is used to render the timestamp in the error logs.
export default function LogTimeStamp(props: {
  timestamp: string;
  severity: Severity;
}) {
  return (
    <div className={`debugger-time ${props.severity}`}>{props.timestamp}</div>
  );
}
