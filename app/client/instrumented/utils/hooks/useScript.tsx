import { useState, useEffect } from "react";

/**
 * Status of script tag element returned from useScript
 */
export enum ScriptStatus {
  IDLE = "idle",
  LOADING = "loading",
  READY = "ready",
  ERROR = "error",
}

/**
 * Where should the script tag be added to?
 * Defaults to body
 */
export enum AddScriptTo {
  BODY = "body", // default
  HEAD = "head",
}

/**
 * Adds a script tag to the DOM and informs when done.
 *
 * @param src value of src in <script src={src}>
 * @param where element under which the script should be added. Defaults to body.
 *
 * @returns Reactive variable `status`. (Check enum ScriptStatus for possible states)
 */
export function useScript(src: string, where = AddScriptTo.BODY): ScriptStatus {
  // Keep track of script status
  const [status, setStatus] = useState<ScriptStatus>(
    src ? ScriptStatus.LOADING : ScriptStatus.IDLE,
  );

  useEffect(
    () => {
      // Allow falsy src value if waiting on other data needed for
      // constructing the script URL passed to this hook.
      if (!src) {
        setStatus(ScriptStatus.IDLE);
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
        script.setAttribute("data-status", ScriptStatus.LOADING);
        if (where === AddScriptTo.HEAD) {
          // Add script to head
          document.head.appendChild(script);
        } else {
          // Add script to document body
          document.body.appendChild(script);
        }

        // Store status in attribute on script
        // This can be read by other instances of this hook
        const setAttributeFromEvent = (event: any) => {
          script.setAttribute(
            "data-status",
            event.type === "load" ? ScriptStatus.READY : ScriptStatus.ERROR,
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
          event.type === "load" ? ScriptStatus.READY : ScriptStatus.ERROR,
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
