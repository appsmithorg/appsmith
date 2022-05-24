class UserLog {
  constructor() {
    this.initiate();
  }
  private logs: any = [];
  private initiate() {
    const { error, log, table } = console;
    console = {
      ...console,
      table: function(value: any) {
        table.call(this, value);
        userLogs.addLog(value, "TABLE");
        return value;
      },
      error: function(value: any) {
        error.call(this, value);
        userLogs.addLog(value, "ERROR");
        return value;
      },
      log: function(value: any) {
        log.call(this, value);
        userLogs.addLog(value, "INFO");
        return value;
      },
      debug: function(value: any) {
        log.call(this, value);
        userLogs.addLog(value, "DEBUG");
        return value;
      },
    };
  }
  public flushLogs() {
    const userLogs = this.logs.slice(0);
    this.resetLogs();
    return userLogs;
  }
  public addLog(log: string, type: any) {
    this.logs.push({ type, value: log });
  }
  private resetLogs() {
    this.logs = [];
  }
}

const userLogs = new UserLog();

export default userLogs;
