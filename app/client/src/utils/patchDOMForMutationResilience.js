// ref https://github.com/reactjs/reactjs.org/pull/1148
function patch() {
  if (typeof Node !== "function" || Node.prototype == null) {
    return;
  }

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function(child) {
    if (child.parentNode !== this) {
      if (typeof console !== "undefined") {
        console.error(
          "Cannot remove a child from a different parent",
          child,
          this,
        );
      }
      return child;
    }
    return originalRemoveChild.apply(this, arguments);
  };
}

patch();
