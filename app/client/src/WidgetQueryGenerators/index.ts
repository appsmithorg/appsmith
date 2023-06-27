import { PluginPackageName } from "entities/Action";
import WidgetQueryGeneratorRegistry from "utils/WidgetQueryGeneratorRegistry";
import GSheets from "./GSheets";
import MongoDB from "./MongoDB";
import PostgreSQL from "./PostgreSQL";

WidgetQueryGeneratorRegistry.register(PluginPackageName.MONGO, MongoDB);
WidgetQueryGeneratorRegistry.register(PluginPackageName.POSTGRES, PostgreSQL);
WidgetQueryGeneratorRegistry.register(PluginPackageName.GOOGLE_SHEETS, GSheets);
