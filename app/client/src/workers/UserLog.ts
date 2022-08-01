import { uuid4 } from "@sentry/utils";
import moment from "moment";

export type Methods =
  | "log"
  | "debug"
  | "info"
  | "warn"
  | "error"
  | "table"
  | "clear"
  | "time"
  | "timeEnd"
  | "count"
  | "assert";

export interface Message {
  method: Methods | "result";
  data: any[];
  timestamp?: string;
  id: string;
}

export function createLogTitleString(data: any[]) {
  // convert mixed array to string
  return data.reduce((acc, curr) => {
    // curr can be a string or an object
    if (typeof curr === "string") {
      return `${acc} ${curr}`;
    }
    return `${acc} ${JSON.stringify(curr)}`;
  }, "");
}

class UserLog {
  constructor() {
    this.initiate();
  }
  private logs: Message[] = [];
  private initiate() {
    const { debug, error, info, log, table, warn } = console;
    console = {
      ...console,
      table: (...args: any) => {
        table.call(this, args);
        const parsed = this.parseLogs("table", args);
        if (parsed) {
          this.logs.push(parsed);
        }
        return;
      },
      error: (...args: any) => {
        error.apply(this, args);
        const parsed = this.parseLogs("error", args);
        if (parsed) {
          this.logs.push(parsed);
        }
        return;
      },
      log: (...args: any) => {
        log.apply(this, args);
        const parsed = this.parseLogs("log", args);
        if (parsed) {
          this.logs.push(parsed);
        }
        return;
      },
      debug: (...args: any) => {
        debug.apply(this, args);
        const parsed = this.parseLogs("debug", args);
        if (parsed) {
          this.logs.push(parsed);
        }
        return;
      },
      warn: (...args: any) => {
        warn.apply(this, args);
        const parsed = this.parseLogs("warn", args);
        if (parsed) {
          this.logs.push(parsed);
        }
        return;
      },
      info: (...args: any) => {
        info.apply(this, args);
        const parsed = this.parseLogs("info", args);
        if (parsed) {
          this.logs.push(parsed);
        }
        return;
      },
    };
  }
  public getTimestamp() {
    return moment().format("hh:mm:ss");
  }
  public flushLogs() {
    const userLogs = this.logs;
    this.resetLogs();
    return userLogs;
  }
  public parseLogs(method: Methods | "result", data: any[]) {
    // this.logs.push({ method, value: JSON.stringify(args) });
    // Create an ID
    const id = uuid4();
    const timestamp = this.getTimestamp();
    // Parse the methods
    switch (method) {
      case "error": {
        const errors = data.map((error) => {
          try {
            return error.stack || error;
          } catch (e) {
            return error;
          }
        });

        return {
          method,
          id,
          data: errors,
          timestamp,
        };
      }

      default: {
        return {
          method,
          id,
          data,
          timestamp,
        };
      }
    }
  }
  private resetLogs() {
    this.logs = [];
  }
}

const userLogs = new UserLog();

export default userLogs;
