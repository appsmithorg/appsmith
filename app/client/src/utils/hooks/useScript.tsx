import { useState, useEffect } from "react";

export enum ScriptStatuses {
  IDLE = "idle",
  LOADING = "loading",
  READY = "ready",
  ERROR = "error",
}

// Hook
export function useScript(src: string, head = false): ScriptStatuses {
  // Keep track of script status
  const [status, setStatus] = useState<ScriptStatuses>(
    src ? ScriptStatuses.LOADING : ScriptStatuses.IDLE,
  );

  useEffect(
    () => {
      // Allow falsy src value if waiting on other data needed for
      // constructing the script URL passed to this hook.
      if (!src) {
        setStatus(ScriptStatuses.IDLE);
        return;
      }

      // Fetch existing script element by src
      // It may have been added by another intance of this hook
      let script = document.querySelector(`script[src="${src}"]`) as any;

      if (!script) {
        // Create script
        script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.setAttribute("data-status", ScriptStatuses.LOADING);
        if (head) {
          const hd = document.getElementsByTagName("head")[0];
          hd.insertBefore(script, hd.lastChild);
        } else {
          // Add script to document body
          document.body.appendChild(script);
        }

        // Store status in attribute on script
        // This can be read by other instances of this hook
        const setAttributeFromEvent = (event: any) => {
          script.setAttribute(
            "data-status",
            event.type === "load" ? ScriptStatuses.READY : ScriptStatuses.ERROR,
          );
        };

        script.addEventListener("load", setAttributeFromEvent);
        script.addEventListener("error", setAttributeFromEvent);
      } else {
        // Grab existing script status from attribute and set to state.
        setStatus(script.getAttribute("data-status"));
      }

      // Script event handler to update status in state
      // Note: Even if the script already exists we still need to add
      // event handlers to update the state for *this* hook instance.
      const setStateFromEvent = (event: any) => {
        setStatus(
          event.type === "load" ? ScriptStatuses.READY : ScriptStatuses.ERROR,
        );
      };

      // Add event listeners
      script.addEventListener("load", setStateFromEvent);
      script.addEventListener("error", setStateFromEvent);

      // Remove event listeners on cleanup
      return () => {
        if (script) {
          script.removeEventListener("load", setStateFromEvent);
          script.removeEventListener("error", setStateFromEvent);
        }
      };
    },
    [src], // Only re-run effect if script src changes
  );

  return status;
}
