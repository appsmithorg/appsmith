import React from "react";
import type { Severity } from "entities/AppsmithConsole";
import { format, formatDistanceToNow, parseISO } from "date-fns";

// This component is used to render the timestamp in the error logs.
export default function LogTimeStamp(props: {
  timestamp: string;
  severity: Severity;
}) {
  return (
    <div className={`debugger-time ${props.severity}`}>
      {format(new Date(parseInt(props.timestamp)), "HH:mm:ss")}
    </div>
  );
}
