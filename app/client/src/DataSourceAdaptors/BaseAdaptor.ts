export interface BaseAdaptorInteface {
  build: (config: any) => object;
}

export default class BaseAdaptor implements BaseAdaptorInteface {
  build(config: any): object {
    const { applicationId, workspaceId } = config;
    // common payload that can be shared across other adaptor
    return {
      applicationId,
      workspaceId,
    };
  }
}
