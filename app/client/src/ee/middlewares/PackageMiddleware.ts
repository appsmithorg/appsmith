import type { Middleware } from "redux";

// This middleware is extended in EE to add package specific logic
const PackageMiddleware: Middleware = () => (next) => (action) => {
  // Simply pass the action to the next middleware/reducer
  return next(action);
};

export default PackageMiddleware;
