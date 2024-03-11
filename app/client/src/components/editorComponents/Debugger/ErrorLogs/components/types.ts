import type { Message, SourceEntity } from "entities/AppsmithConsole";
import type { LOG_CATEGORY } from "entities/AppsmithConsole";
import type { Severity } from "widgets/types";
import type LOG_TYPE from "entities/AppsmithConsole/logtype";
import type { PluginErrorDetails } from "api/actionAPITypes";

export interface LogItemProps {
  collapsable?: boolean;
  icon: string;
  timestamp: string;
  label: string;
  timeTaken: string;
  severity: Severity;
  text: string;
  category: LOG_CATEGORY;
  iconId?: string;
  logType?: LOG_TYPE;
  logData?: any[];
  state?: Record<string, any>;
  id?: string;
  source?: SourceEntity;
  messages?: Message[];
  pluginErrorDetails?: PluginErrorDetails;
  isExpanded: boolean;
  environmentName?: string;
}
