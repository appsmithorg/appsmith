import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import CalloutComponent from "../editorComponents/CalloutComponent";

class AlertWidget extends BaseWidget<AlertWidgetProps, WidgetState> {
  getPageView() {
    return <div />;
  }

  getWidgetType(): WidgetType {
    return "ALERT_WIDGET";
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
