export default class DslService {
  static async migrateDsl(dslObj: any): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        // TODO: migrate the DSL
        dslObj.username = "nayan";
        resolve(dslObj);
      } catch (err) {
        reject(err);
      }
    });
  }

  static async getLatestDslVersionNumber(): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        // TODO: migrate the DSL
        const latestDslVersionNumber = 100;
        resolve(latestDslVersionNumber);
      } catch (err) {
        reject(err);
      }
    });
  }
}
