import auditLogs from "./AuditLogs";

const frameworkFunctionProxyHandler = (
  fullName: string,
  funcExecutionStart: (fullName: string) => void,
) => ({
  apply: function() {
    funcExecutionStart(fullName);
  },
});

class FrameworkFuncProxy {
  constructor() {
    this.functionExecutionStart = this.functionExecutionStart.bind(this);
  }

  // When a function is called, increase number of pending functions;
  private functionExecutionStart(fullName: string) {
    auditLogs.saveLog({ actionName: fullName });
  }

  // Wrapper around JS Functions
  public addProxy(
    frameworkFunction: (...args: unknown[]) => unknown,
    frameworkFunctionName: string,
  ) {
    return new Proxy(
      frameworkFunction,
      frameworkFunctionProxyHandler(
        frameworkFunctionName,
        this.functionExecutionStart,
      ),
    );
  }
}

const frameworkFunctionWrapper = new FrameworkFuncProxy();
export default frameworkFunctionWrapper;
