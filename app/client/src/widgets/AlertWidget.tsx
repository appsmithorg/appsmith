import React, { Component } from "react";
import { WidgetProps } from "./BaseWidget";

class AlertWidget extends Component {
  getPageView() {
    return <div />;
  }
}

export type AlertType = "DIALOG" | "NOTIFICATION";
export type MessageIntent = "SUCCESS" | "ERROR" | "INFO" | "WARNING";

export interface AlertWidgetProps extends WidgetProps {
  alertType: AlertType;
  intent: MessageIntent;
  header: string;
  message: string;
}

export default AlertWidget;
