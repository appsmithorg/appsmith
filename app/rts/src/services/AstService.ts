import { extractInfoFromCode } from "@shared/ast";

export default class AstService {
  static async extractDataFromScript(
    script,
    evalVersion,
    invalidIdentifiers = {}
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const extractions = extractInfoFromCode(
          script,
          evalVersion,
          invalidIdentifiers
        );

        resolve(extractions);
      } catch (err) {
        reject(err);
      }
    });
  }
}
