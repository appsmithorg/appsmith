import { extractInfoFromCode } from "@shared/ast";

export default class AstService {
  static async extractInfoFromScript(script, evalVersion): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const extractions = extractInfoFromCode(script, evalVersion);

        resolve(extractions);
      } catch (err) {
        reject(err);
      }
    });
  }
}
