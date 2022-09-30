import { extractIdentifierInfoFromCode } from "@shared/ast";

export default class AstService {
  static async extractIdentifierDataFromScript(
    script,
    evalVersion,
    invalidIdentifiers = {}
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const identifierInfo = extractIdentifierInfoFromCode(
          script,
          evalVersion,
          invalidIdentifiers
        );

        resolve(identifierInfo);
      } catch (err) {
        reject(err);
      }
    });
  }
}
