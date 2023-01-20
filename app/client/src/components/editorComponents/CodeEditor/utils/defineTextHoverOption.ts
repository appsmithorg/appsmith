import CodeMirror from "codemirror";

class TextHoverState {
  options: any;
  timeout: any = null;
  keyMap = null;
  cm: any;
  readonly HOVER_CLASS = " CodeMirror-hover";
  eventListener: any;
  removeEventListener: any;

  constructor(cm: any, options: any) {
    this.cm = cm;
    this.options = options;
  }

  registerMouseOver() {
    console.log(
      "text hover - register mouse over",
      this.cm.getWrapperElement(),
    );
    const eventListener = (e: any) => {
      console.log("text hover - on mouseover", this);
      const node = e.target || e.srcElement;
      if (node) {
        if (/\bCodeMirror-lint-mark-/.test(node.className)) return; // hack if lint addon is used to give it a higher priority
        const data = this.getTokenAndPosAt(e);
        const content = this.options.getTextHover(this.cm, data, e);
        console.log("text hover - mouse over", content);
        if (content) {
          node.className += this.HOVER_CLASS;
          if (typeof content == "function")
            content(this.showTooltipFor, data, e, node);
          else this.showTooltipFor(e, content, node);
        }
      }
    };
    CodeMirror.on(this.cm.getWrapperElement(), "mouseover", eventListener);
    this.removeEventListener = () => {
      CodeMirror.off(this.cm.getWrapperElement(), "mouseover", eventListener);
    };
  }

  unregisterMouseOver() {
    this.removeEventListener?.();
    this.removeEventListener = undefined;
  }

  getTokenAndPosAt(e: any) {
    // When the mouseover fires, the cursor might not actually be over
    // the character itself yet. These pairs of x,y offsets are used to
    // probe a few nearby points when no suitable marked range is found.
    const nearby = [0, 0, 0, 5, 0, -5, 5, 0, -5, 0];
    const node = e.target || e.srcElement,
      text = node.innerText || node.textContent;
    for (let i = 0; i < nearby.length; i += 2) {
      const pos = this.cm.coordsChar({
        left: e.clientX + nearby[i],
        top: e.clientY + nearby[i + 1],
      });
      const token = this.cm.getTokenAt(pos);
      if (token && token.string === text) {
        return {
          token: token,
          pos: pos,
        };
      }
    }
  }

  showTooltipFor(e: any, content: any, node: any) {
    let tooltip: any | undefined = this.showTooltip(e, content);
    const hide = () => {
      CodeMirror.off(node, "mouseout", hide);
      CodeMirror.off(node, "click", hide);
      node.className = node.className.replace(this.HOVER_CLASS, "");
      if (tooltip) {
        this.hideTooltip(tooltip);
        tooltip = null;
      }
      // cm.removeKeyMap(state.keyMap);
    };
    const poll: any = setInterval(() => {
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
    // state.keyMap = { Esc: hide };
    // cm.addKeyMap(state.keyMap);
  }

  showTooltip(e: any, content: any) {
    const tt = document.createElement("div");
    tt.className = "CodeMirror-hover-tooltip";
    if (typeof content == "string") {
      content = document.createTextNode(content);
    }
    tt.appendChild(content);
    tt.style.position = "absolute";
    tt.style.zIndex = "3";
    tt.style.backgroundColor = "white";
    tt.style.padding = "5px";
    tt.style.boxShadow = "10px 5px 5px black";
    document.body.appendChild(tt);

    const position = (e: any) => {
      const target_rect = e.target.getBoundingClientRect(),
        tt_rect = tt.getBoundingClientRect();
      if (tt_rect.height <= target_rect.top) {
        tt.style.top = target_rect.top - tt_rect.height + "px";
      } else {
        tt.style.top = target_rect.bottom + "px";
      }
      tt.style.left = target_rect.left + "px";
    };
    CodeMirror.on(document, "mousemove", position);
    position(e);
    if (tt.style.opacity != null) tt.style.opacity = "1";
    return tt;
  }

  rm(elt: any) {
    if (elt.parentNode) elt.parentNode.removeChild(elt);
  }

  hideTooltip(tt: any) {
    if (!tt.parentNode) return;
    if (tt.style.opacity == null) this.rm(tt);
    tt.style.opacity = 0;
    setTimeout(() => {
      this.rm(tt);
    }, 600);
  }
}
function parseOptions(cm: any, options: any) {
  if (!options || options === true) options = {};
  if (!options.getTextHover)
    options.getTextHover = (CodeMirror as any).textHover.javascript;
  if (!options.getTextHover) {
    console.error("Required option 'getTextHover' missing (text-hover addon)");
    return;
  }
  return options;
}

export default function defineTextHoverOption() {
  CodeMirror.defineOption("textHover", false, (cm: any, val: any, old: any) => {
    if (old && old.toString() !== "CodeMirror.Init") {
      cm.state.textHover.unregisterMouseOver();
    }

    if (val) {
      const options = parseOptions(cm, val);
      if (!options) return;
      cm.state.textHover = new TextHoverState(cm, options);
      cm.state.textHover.registerMouseOver();
    }
  });
}
