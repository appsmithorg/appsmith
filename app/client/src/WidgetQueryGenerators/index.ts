import { PluginPackageName } from "entities/Action";
import WidgetQueryGeneratorRegistry from "utils/WidgetQueryGeneratorRegistry";
import MongoDB from "./MongoDB";
import PostgreSQL from "./PostgreSQL";

WidgetQueryGeneratorRegistry.register(PluginPackageName.MONGO, MongoDB);
WidgetQueryGeneratorRegistry.register(PluginPackageName.POSTGRES, PostgreSQL);
