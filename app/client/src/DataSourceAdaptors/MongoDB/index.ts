import BaseAdaptor from "../BaseAdaptor";

export const MONGO_DB_PLUGIN_ID = "MongoDB";

export default class MongoDB extends BaseAdaptor {
  build(config: object): object {
    const baseTemplateResponse = super.build(config);
    //call mongoDb own build function and merge it with the
    //baseTemplateResponse
    return baseTemplateResponse;
  }
}
