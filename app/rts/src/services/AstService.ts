import { extractIdentifierInfoFromCode, entityRefactorFromCode } from "@shared/ast";

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
  static async entityRefactor(
    script,
    oldName,
    newName,
    isJSObject,
    evalVersion
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const refactoredCode = entityRefactorFromCode(
          script,
          oldName,
          newName,
          isJSObject,
          evalVersion
        );

        resolve(refactoredCode);
      } catch (err) {
        reject(err);
      }
    });
  }
}
