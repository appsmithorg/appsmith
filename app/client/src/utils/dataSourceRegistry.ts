import MongoDB, { MONGO_DB_PLUGIN_ID } from "DataSourceAdaptors/MongoDB";
import PostgreSQL, {
  POSTGRE_SQL_PLUGIN_ID,
} from "DataSourceAdaptors/PostgreSQL";
import { error } from "loglevel";

export default class DataSourceRegistry {
  private static ALL_DATASOURCE_ADAPTORS: [any, string][] = [
    [PostgreSQL, POSTGRE_SQL_PLUGIN_ID],
    [MongoDB, MONGO_DB_PLUGIN_ID],
  ];

  private static queryGeneratorMap = new Map();

  private static register(pluginId: string, queryGenerator: any) {
    if (this.queryGeneratorMap.get(pluginId)) {
      error("Overwriting an existing adaptor", pluginId);

      return;
    }
    this.queryGeneratorMap.set(pluginId, queryGenerator);
  }

  static getAdaptor(pluginId: string) {
    const adaptor = this.queryGeneratorMap.get(pluginId);
    if (!adaptor) {
      error("No adaptor present", pluginId);
      return;
    }
    return adaptor;
  }

  static {
    this.ALL_DATASOURCE_ADAPTORS.forEach(([Adaptor, pluginId]) => {
      this.register(pluginId, new Adaptor());
    });
  }
}
