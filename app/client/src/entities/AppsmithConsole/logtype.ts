enum LOG_TYPE {
  WIDGET_PROPERTY_VALIDATION_ERROR = "WidgetPropertyValidationError",
  WIDGET_UPDATE = "WidgetUpdate",
  ACTION_EXECUTION_ERROR = "PluginExecutionError",
  ACTION_EXECUTION_SUCCESS = "PluginExecutionSuccess",
  ENTITY_DELETED = "EntityDeleted",
  EVAL_ERROR = "SyntaxError",
  TRIGGER_EVAL_ERROR = "TriggerExecutionError",
  EVAL_WARNING = "SyntaxWarning",
  ACTION_UPDATE = "ActionUpdate",
  JS_ACTION_UPDATE = "JSActionUpdate",
  JS_PARSE_ERROR = "JSParseError",
  JS_PARSE_SUCCESS = "JSParseSuccess",
  CYCLIC_DEPENDENCY_ERROR = "CyclicDependencyError",
  LINT_ERROR = "LintingError",
}

export default LOG_TYPE;
