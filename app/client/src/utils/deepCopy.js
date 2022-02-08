function copyBuffer(cur) {
  if (cur instanceof Buffer) {
    return Buffer.from(cur);
  }

  return new cur.constructor(cur.buffer.slice(), cur.byteOffset, cur.length);
}

export function rfdc(opts) {
  opts = opts || {};

  if (opts.circles) return rfdcCircles(opts);
  return opts.proto ? cloneProto : clone;

  function cloneArray(a, fn) {
    const keys = Object.keys(a);
    const a2 = new Array(keys.length);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const cur = a[k];
      if (typeof cur !== "object" || cur === null) {
        a2[k] = cur;
      } else if (cur instanceof Date) {
        a2[k] = new Date(cur);
      } else if (ArrayBuffer.isView(cur)) {
        a2[k] = copyBuffer(cur);
      } else {
        a2[k] = fn(cur);
      }
    }
    return a2;
  }

  function clone(o) {
    if (typeof o !== "object" || o === null) return o;
    if (o instanceof Date) return new Date(o);
    if (Array.isArray(o)) return cloneArray(o, clone);
    if (o instanceof Map) return new Map(cloneArray(Array.from(o), clone));
    if (o instanceof Set) return new Set(cloneArray(Array.from(o), clone));
    const o2 = {};
    for (const k in o) {
      if (Object.hasOwnProperty.call(o, k) === false) continue;
      const cur = o[k];
      if (typeof cur !== "object" || cur === null) {
        o2[k] = cur;
      } else if (cur instanceof Date) {
        o2[k] = new Date(cur);
      } else if (cur instanceof Map) {
        o2[k] = new Map(cloneArray(Array.from(cur), clone));
      } else if (cur instanceof Set) {
        o2[k] = new Set(cloneArray(Array.from(cur), clone));
      } else if (ArrayBuffer.isView(cur)) {
        o2[k] = copyBuffer(cur);
      } else {
        o2[k] = clone(cur);
      }
    }
    return o2;
  }

  function cloneProto(o) {
    if (typeof o !== "object" || o === null) return o;
    if (o instanceof Date) return new Date(o);
    if (Array.isArray(o)) return cloneArray(o, cloneProto);
    if (o instanceof Map) return new Map(cloneArray(Array.from(o), cloneProto));
    if (o instanceof Set) return new Set(cloneArray(Array.from(o), cloneProto));
    const o2 = {};
    for (const k in o) {
      const cur = o[k];
      if (typeof cur !== "object" || cur === null) {
        o2[k] = cur;
      } else if (cur instanceof Date) {
        o2[k] = new Date(cur);
      } else if (cur instanceof Map) {
        o2[k] = new Map(cloneArray(Array.from(cur), cloneProto));
      } else if (cur instanceof Set) {
        o2[k] = new Set(cloneArray(Array.from(cur), cloneProto));
      } else if (ArrayBuffer.isView(cur)) {
        o2[k] = copyBuffer(cur);
      } else {
        o2[k] = cloneProto(cur);
      }
    }
    return o2;
  }
}

function rfdcCircles(opts) {
  const refs = [];
  const refsNew = [];

  return opts.proto ? cloneProto : clone;

  function cloneArray(a, fn) {
    const keys = Object.keys(a);
    const a2 = new Array(keys.length);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const cur = a[k];
      if (typeof cur !== "object" || cur === null) {
        a2[k] = cur;
      } else if (cur instanceof Date) {
        a2[k] = new Date(cur);
      } else if (ArrayBuffer.isView(cur)) {
        a2[k] = copyBuffer(cur);
      } else {
        const index = refs.indexOf(cur);
        if (index !== -1) {
          a2[k] = refsNew[index];
        } else {
          a2[k] = fn(cur);
        }
      }
    }
    return a2;
  }

  function clone(o) {
    if (typeof o !== "object" || o === null) return o;
    if (o instanceof Date) return new Date(o);
    if (Array.isArray(o)) return cloneArray(o, clone);
    if (o instanceof Map) return new Map(cloneArray(Array.from(o), clone));
    if (o instanceof Set) return new Set(cloneArray(Array.from(o), clone));
    const o2 = {};
    refs.push(o);
    refsNew.push(o2);
    for (const k in o) {
      if (Object.hasOwnProperty.call(o, k) === false) continue;
      const cur = o[k];
      if (typeof cur !== "object" || cur === null) {
        o2[k] = cur;
      } else if (cur instanceof Date) {
        o2[k] = new Date(cur);
      } else if (cur instanceof Map) {
        o2[k] = new Map(cloneArray(Array.from(cur), clone));
      } else if (cur instanceof Set) {
        o2[k] = new Set(cloneArray(Array.from(cur), clone));
      } else if (ArrayBuffer.isView(cur)) {
        o2[k] = copyBuffer(cur);
      } else {
        const i = refs.indexOf(cur);
        if (i !== -1) {
          o2[k] = refsNew[i];
        } else {
          o2[k] = clone(cur);
        }
      }
    }
    refs.pop();
    refsNew.pop();
    return o2;
  }

  function cloneProto(o) {
    if (typeof o !== "object" || o === null) return o;
    if (o instanceof Date) return new Date(o);
    if (Array.isArray(o)) return cloneArray(o, cloneProto);
    if (o instanceof Map) return new Map(cloneArray(Array.from(o), cloneProto));
    if (o instanceof Set) return new Set(cloneArray(Array.from(o), cloneProto));
    const o2 = {};
    refs.push(o);
    refsNew.push(o2);
    for (const k in o) {
      const cur = o[k];
      if (typeof cur !== "object" || cur === null) {
        o2[k] = cur;
      } else if (cur instanceof Date) {
        o2[k] = new Date(cur);
      } else if (cur instanceof Map) {
        o2[k] = new Map(cloneArray(Array.from(cur), cloneProto));
      } else if (cur instanceof Set) {
        o2[k] = new Set(cloneArray(Array.from(cur), cloneProto));
      } else if (ArrayBuffer.isView(cur)) {
        o2[k] = copyBuffer(cur);
      } else {
        const i = refs.indexOf(cur);
        if (i !== -1) {
          o2[k] = refsNew[i];
        } else {
          o2[k] = cloneProto(cur);
        }
      }
    }
    refs.pop();
    refsNew.pop();
    return o2;
  }
}
