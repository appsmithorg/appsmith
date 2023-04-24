import type { Middleware } from "redux";

const actionPatterns = [
  /GET_TEMPLATES/,
  /GET_TEMPLATE/,
  /FETCH_RELEASES/,
  /FETCH_MOCK_DATASOURCES/,
  /FETCH_PROVIDER/,
  /FETCH_PROVIDERS/,
  /REDIRECT_AUTHORIZATION_CODE/,
  /GET_OAUTH_ACCESS/,
];

const blockActionMiddleware = (patterns: RegExp[]): Middleware => {
  return () => (next) => (action) => {
    const matchedPattern = patterns.find((pattern) =>
      action.type.match(pattern),
    );
    if (matchedPattern) {
      // Block the action if it matches the pattern
      console.warn(
        `Action ${action.type} was blocked by pattern ${matchedPattern}.`,
      );
      return;
    }

    return next(action);
  };
};

export default blockActionMiddleware(actionPatterns);
