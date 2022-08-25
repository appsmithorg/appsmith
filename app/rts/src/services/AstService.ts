import { extractIdentifiersFromCode } from "@shared/ast";

export default class AstService {
  static getIndentifiersFromScript(script, evalVersion) {
    return extractIdentifiersFromCode(
      script,
      evalVersion,
    );
  }
}
