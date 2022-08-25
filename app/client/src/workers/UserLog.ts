import { uuid4 } from "@sentry/utils";
import { Severity, SourceEntity } from "entities/AppsmithConsole";
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

export type UserLogObject = { logObject: LogObject[]; source: SourceEntity };

// Type of the log object
export type LogObject = {
  method: Methods | "result";
  data: any[];
  timestamp: string;
  id: string;
  severity: Severity;
};

const truncate = (input: string, suffix = "", truncLen = 100) => {
  try {
    if (!!input) {
      return input.length > truncLen
        ? `${input.substring(0, truncLen)}...${suffix}`
        : input;
    } else {
      return "-";
    }
  } catch (error) {
    return `--${JSON.stringify(error)}-${input}`;
  }
};

// Converts the data from the log object to a string
export function createLogTitleString(data: any[]) {
  try {
    // convert mixed array to string
    return data.reduce((acc, curr) => {
      // curr can be a string or an object
      let joiningChar = ",";
      if (acc.length === 0) {
        joiningChar = "";
      }
      if (typeof curr === "string") {
        return `${acc}${joiningChar} ${truncate(curr)}`;
      }
      if (typeof curr === "number") {
        return `${acc}${joiningChar} ${truncate(curr.toString())}`;
      }
      if (typeof curr === "function") {
        return `${acc}${joiningChar} func() ${curr.name}`;
      }
      if (typeof curr === "object") {
        let suffix = "}";
        if (Array.isArray(curr)) {
          suffix = "]";
        }
        return `${acc}${joiningChar} ${truncate(
          JSON.stringify(curr, null, "\t"),
          suffix,
        )}`;
      }
      acc = `${acc}${joiningChar} -`;
    }, "");
  } catch (error) {
    return `---${JSON.stringify(error)}-${JSON.stringify(data)}`;
  }
}

class UserLog {
  constructor() {
    this.initiate();
  }
  private logs: LogObject[] = [];
  // initiates the log object with the default methods and their overrides
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
  public replaceFunctionWithNamesFromObjects(data: any) {
    if (typeof data === "object") {
      for (const key in data) {
        if (typeof data[key] === "function") {
          data[key] = `func() ${data[key].name}`;
        } else {
          this.replaceFunctionWithNamesFromObjects(data[key]);
        }
      }
    }
    return data;
  }
  // iterates over the data and if data is object/array, then it will remove any functions from it
  public sanitizeData(data: any): any {
    let returnData = [];

    try {
      returnData = data.map((item: any) => {
        if (typeof item === "object") {
          return this.replaceFunctionWithNamesFromObjects(item);
        }

        // if the item is a function, then remove it from the data and return it as name of the function
        if (typeof item === "function") {
          return item.name;
        }
        return item;
      });
    } catch (e) {
      returnData = [`There was some error: ${e} ${JSON.stringify(data)}`];
    }
    return returnData;
  }
  // returns the logs from the function execution after sanitising them and resets the logs object after that
  public flushLogs(): LogObject[] {
    const userLogs = this.logs;
    this.resetLogs();
    // sanitise the data key of the user logs
    const sanitisedLogs = userLogs.map((log) => {
      return {
        ...log,
        data: this.sanitizeData(log.data),
      };
    });
    return sanitisedLogs;
  }

  // parses the incoming log and converts it to the log object
  public parseLogs(method: Methods, data: any[]): LogObject {
    // Create an ID
    const id = uuid4();
    const timestamp = this.getTimestamp();
    // Parse the methods
    let output = data;
    // For logs UI we only keep 3 levels of severity, info, warn, error
    let severity = Severity.INFO;
    if (method === "error") {
      severity = Severity.ERROR;
      output = data.map((error) => {
        try {
          return error.stack || error;
        } catch (e) {
          return error;
        }
      });
    } else if (method === "warn") {
      severity = Severity.WARNING;
    }

    return {
      method,
      id,
      data: output,
      timestamp,
      severity,
    };
  }
  public resetLogs() {
    this.logs = [];
  }
}

const userLogs = new UserLog();

export default userLogs;
