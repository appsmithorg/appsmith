import { uuid4 } from "@sentry/utils";

/* eslint-disable no-console */
const methods = [
  "log",
  "debug",
  "table",
  "clear",
  "time",
  "timeEnd",
  "count",
  "assert",
];

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

class UserLog {
  constructor() {
    this.initiate();
  }
  private logs: Message[] = [];
  private initiate() {
    for (const method of methods) {
      if (console.hasOwnProperty(method)) {
        let NativeMethod = console[method as Methods];
        NativeMethod = (...args: any) => {
          // NativeMethod.call(this, args);
          const parsed = this.parseLogs(method as Methods, args);
          if (parsed) {
            this.logs.push(parsed);
            // let encoded: Message = parsed as Message;
            // if (encode) {
            // encoded = Encode(parsed) as Message;
            // }
            // callback(encoded, parsed);
          }
          return;
        };
        console = {
          ...console,
          [method]: NativeMethod,
        };
      }
    }
    // const { debug, error, log, table } = console;
    // console = {
    //   ...console,
    //   table: function(value: any) {
    //     table.call(this, value);
    //     userLogs.addLog(value, "TABLE");
    //     return value;
    //   },
    //   error: function(value: any) {
    //     error.call(this, value);
    //     userLogs.addLog(value, "ERROR");
    //     return value;
    //   },
    //   log: function(...args) {
    //     log.call(this, args);
    //     userLogs.addLog(args, "INFO");
    //     return;
    //   },
    //   debug: function(value: any) {
    //     debug.call(this, value);
    //     userLogs.addLog(value, "DEBUG");
    //     return value;
    //   },
    // };
  }
  public getNumberStringWithWidth(num: number, width: number) {
    const str = num.toString();
    if (width > str.length) return "0".repeat(width - str.length) + str;
    return str.substr(0, width);
  }
  public getTimestamp() {
    const date = new Date();
    const h = this.getNumberStringWithWidth(date.getHours(), 2);
    const min = this.getNumberStringWithWidth(date.getMinutes(), 2);
    const sec = this.getNumberStringWithWidth(date.getSeconds(), 2);
    return `${h}:${min}:${sec}`;
  }
  public flushLogs(result: any) {
    if (!!result) {
      const resultLog = this.parseLogs("result", ["Output:", result]);
      if (resultLog) {
        this.logs.push(resultLog);
      } else {
        this.logs.push({
          method: "result",
          id: uuid4(),
          data: ["parse fail result here", result],
          timestamp: this.getTimestamp(),
        });
      }
    } else {
      this.logs.push({
        method: "result",
        id: uuid4(),
        data: ["No result here", result],
        timestamp: this.getTimestamp(),
      });
    }
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
      case "clear": {
        return {
          method,
          id,
          timestamp,
          data: [],
        };
      }

      // case "count": {
      //   const label = typeof data[0] === "string" ? data[0] : "default";
      //   if (!label) return false;

      //   return {
      //     ...Count.increment(label),
      //     id,
      //   };
      // }

      // case "time":
      // case "timeEnd": {
      //   const label = typeof data[0] === "string" ? data[0] : "default";
      //   if (!label) return false;

      //   if (method === "time") {
      //     Timing.start(label);
      //     return false;
      //   }

      //   return {
      //     ...Timing.stop(label),
      //     id,
      //   };
      // }

      // case "assert": {
      //   const valid = data.length !== 0;

      //   if (valid) {
      //     const assertion = Assert.test(data[0], ...data.slice(1));
      //     if (assertion) {
      //       return {
      //         ...assertion,
      //         id,
      //       };
      //     }
      //   }

      //   return false;
      // }

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
