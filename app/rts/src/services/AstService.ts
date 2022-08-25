import { extractIdentifiersFromCode } from "@shared/ast";

export default class AstService {
  static getIdentifiersFromScript(script, evalVersion) {
    return extractIdentifiersFromCode(
      script,
      evalVersion,
    );
  }
}
