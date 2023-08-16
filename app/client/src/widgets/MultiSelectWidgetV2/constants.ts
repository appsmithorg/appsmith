import type { WidgetProps } from "widgets/BaseWidget";

export const MY_MULTISELECT_WIDGET_CONSTANT = "";

export const defaultValueExpressionPrefix = `{{ ((options, serverSideFiltering) => ( `;

export const getDefaultValueExpressionSuffix = (widget: WidgetProps) =>
  `))(${widget.widgetName}.options, ${widget.widgetName}.serverSideFiltering) }}`;

export const getOptionLabelValueExpressionPrefix = (widget: WidgetProps) =>
  `{{${widget.widgetName}.sourceData.map((item) => (`;

export const optionLabelValueExpressionSuffix = `))}}`;
