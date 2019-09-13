import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import TextComponent from "../editorComponents/TextComponent";

class TableWidget extends BaseWidget<TableWidgetProps, WidgetState> {
  getPageView() {
    return <div />;
  }

  getWidgetType(): WidgetType {
    return "TABLE_WIDGET";
  }
}

export type PaginationType = "PAGES" | "INFINITE_SCROLL";

export interface TableWidgetProps extends WidgetProps {
  pageKey?: string;
  label: string;
  tableData?: object[];
}

export default TableWidget;
