import { PluginPackageName } from "entities/Action";
import WidgetQueryGeneratorRegistry from "utils/WidgetQueryGeneratorRegistry";

import GSheets from "./GSheets";
import MsSQL from "./MSSQL";
import MongoDB from "./MongoDB";
import MySQL from "./MySQL";
import PostgreSQL from "./PostgreSQL";
import Snowflake from "./Snowflake";

WidgetQueryGeneratorRegistry.register(PluginPackageName.MONGO, MongoDB);
WidgetQueryGeneratorRegistry.register(PluginPackageName.POSTGRES, PostgreSQL);
WidgetQueryGeneratorRegistry.register(PluginPackageName.GOOGLE_SHEETS, GSheets);
WidgetQueryGeneratorRegistry.register(PluginPackageName.MY_SQL, MySQL);
WidgetQueryGeneratorRegistry.register(PluginPackageName.MS_SQL, MsSQL);
WidgetQueryGeneratorRegistry.register(PluginPackageName.SNOWFLAKE, Snowflake);
