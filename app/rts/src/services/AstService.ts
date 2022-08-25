import { extractIdentifiersFromCode } from "@shared/ast";

export default class AstService {
  static async getIdentifiersFromScript(script, evalVersion) {
    return new Promise((resolve, reject) => {
      try {
        const identifiers = extractIdentifiersFromCode(script, evalVersion);
        resolve(identifiers);
      } catch (err) {
        reject(err);
      }
    });
  }
}
