export default class DslService {
  static async migrateDsl(dslObj): Promise<any> {
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
}
