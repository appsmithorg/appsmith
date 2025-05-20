import { useMemo } from "react";

export default function useMessage(msg: string, args: Record<string, string>) {
  return useMemo(() => {
    const msgWithArgs = msg.replace(/\{\{([^}]+)\}\}/g, (match, p1) => {
      // p1 is the key from {{key}} in the message
      return args[p1] || match;
    });

    return msgWithArgs;
  }, [msg, args]);
}
