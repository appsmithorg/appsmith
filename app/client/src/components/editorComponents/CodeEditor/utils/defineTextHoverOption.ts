import CodeMirror from "codemirror";

export default function defineTextHoverOption() {
  const HOVER_CLASS = " CodeMirror-hover";

  function showTooltip(e: any, content: any) {
    const tt = document.createElement("div");
    tt.className = "CodeMirror-hover-tooltip";
    if (typeof content == "string") {
      content = document.createTextNode(content);
    }
    tt.appendChild(content);
    document.body.appendChild(tt);

    function position(e: any) {
      const target_rect = e.target.getBoundingClientRect(),
        tt_rect = tt.getBoundingClientRect();
      if (tt_rect.height <= target_rect.top) {
        tt.style.top = target_rect.top - tt_rect.height + "px";
      } else {
        tt.style.top = target_rect.bottom + "px";
      }
      tt.style.left = target_rect.left + "px";
    }
    CodeMirror.on(document, "mousemove", position);
    position(e);
    if (tt.style.opacity != null) tt.style.opacity = "1";
    return tt;
  }
  function rm(elt: any) {
    if (elt.parentNode) elt.parentNode.removeChild(elt);
  }
  function hideTooltip(tt: any) {
    if (!tt.parentNode) return;
    if (tt.style.opacity == null) rm(tt);
    tt.style.opacity = 0;
    setTimeout(function() {
      rm(tt);
    }, 600);
  }

  function showTooltipFor(
    e: any,
    content: any,
    node: any,
    state: any,
    cm: any,
  ) {
    let tooltip: any | undefined = showTooltip(e, content);
    function hide() {
      CodeMirror.off(node, "mouseout", hide);
      CodeMirror.off(node, "click", hide);
      node.className = node.className.replace(HOVER_CLASS, "");
      if (tooltip) {
        hideTooltip(tooltip);
        tooltip = null;
      }
      cm.removeKeyMap(state.keyMap);
    }
    const poll: any = setInterval(function() {
      if (tooltip)
        for (let n = node; ; n = n.parentNode) {
          if (n == document.body) return;
          if (!n) {
            hide();
            break;
          }
        }
      if (!tooltip) return clearInterval(poll);
    }, 400);
    CodeMirror.on(node, "mouseout", hide);
    CodeMirror.on(node, "click", hide);
    state.keyMap = { Esc: hide };
    cm.addKeyMap(state.keyMap);
  }

  class TextHoverState {
    options: any;
    timeout: any = null;
    onMouseOver: any;
    keyMap = null;

    constructor(cm: any, options: any) {
      if (options.delay) {
        this.onMouseOver = function(e: any) {
          onMouseOverWithDelay(cm, e);
        };
      } else {
        this.onMouseOver = function(e: any) {
          onMouseOver(cm, e);
        };
      }
    }
  }

  function parseOptions(cm: any, options: any) {
    if (options instanceof Function)
      return {
        getTextHover: options,
      };
    if (!options || options === true) options = {};
    if (!options.getTextHover)
      options.getTextHover = cm.getHelper(CodeMirror.Pos(0, 0), "textHover");
    if (!options.getTextHover)
      throw new Error(
        "Required option 'getTextHover' missing (text-hover addon)",
      );
    return options;
  }

  function onMouseOverWithDelay(cm: any, e: any) {
    const state = cm.state.textHover,
      delay = state.options.delay;
    clearTimeout(state.timeout);
    if (e.srcElement) {
      // hack for IE, because e.srcElement failed when it is used in the tiemout function
      const newE = {
        srcElement: e.srcElement,
        clientX: e.clientX,
        clientY: e.clientY,
      };
      e = newE;
    }
    state.timeout = setTimeout(function() {
      onMouseOver(cm, e);
    }, delay);
  }

  function onMouseOver(cm: any, e: any) {
    const node = e.target || e.srcElement;
    if (node) {
      if (/\bCodeMirror-lint-mark-/.test(node.className)) return; // hack if lint addon is used to give it a higher priority
      const state = cm.state.textHover,
        data = getTokenAndPosAt(cm, e);
      const content = state.options.getTextHover(cm, data, e);
      // console.log(content);
      if (content) {
        node.className += HOVER_CLASS;
        if (typeof content == "function")
          content(showTooltipFor, data, e, node, state, cm);
        else showTooltipFor(e, content, node, state, cm);
      }
    }
  }

  function optionHandler(cm: any, val: any, old: any) {
    console.log("option handler called");
    if (old) {
      // && old != CodeMirror.Init
      CodeMirror.off(
        cm.getWrapperElement(),
        "mouseover",
        cm.state.textHover.onMouseOver,
      );
      delete cm.state.textHover;
    }

    if (val) {
      const state = (cm.state.textHover = new TextHoverState(
        cm,
        parseOptions(cm, val),
      ));
      CodeMirror.on(cm.getWrapperElement(), "mouseover", state.onMouseOver);
    }
  }

  // When the mouseover fires, the cursor might not actually be over
  // the character itself yet. These pairs of x,y offsets are used to
  // probe a few nearby points when no suitable marked range is found.
  const nearby = [0, 0, 0, 5, 0, -5, 5, 0, -5, 0];

  function getTokenAndPosAt(cm: any, e: any) {
    const node = e.target || e.srcElement,
      text = node.innerText || node.textContent;
    for (let i = 0; i < nearby.length; i += 2) {
      const pos = cm.coordsChar({
        left: e.clientX + nearby[i],
        top: e.clientY + nearby[i + 1],
      });
      const token = cm.getTokenAt(pos);
      if (token && token.string === text) {
        return {
          token: token,
          pos: pos,
        };
      }
    }
  }

  CodeMirror.defineOption("textHover", false, optionHandler); // deprecated
}
