import BaseAdaptor from "../BaseAdaptor";

export const POSTGRE_SQL_PLUGIN_ID = "PostgreSQL";

export default class PostgreSQL extends BaseAdaptor {
  build(config: object): object {
    const baseTemplateResponse = super.build(config);
    //call PostgreSQL own build function and merge it with the

    return baseTemplateResponse;
  }
}
