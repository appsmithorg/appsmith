"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileNode = void 0;
class ProfileNode {
    callFrame;
    callUID;
    self;
    total;
    id;
    parent;
    children;
    depth;
    deoptReason;
    constructor(callFrame) {
        this.callFrame = callFrame;
        this.callUID = `${callFrame.functionName}@${callFrame.scriptId}:${callFrame.lineNumber}:${callFrame.columnNumber}`;
        this.self = 0;
        this.total = 0;
        this.id = 0;
        this.parent = null;
        this.children = [];
    }
    get functionName() {
        return this.callFrame.functionName;
    }
    get scriptId() {
        return String(this.callFrame.scriptId);
    }
    get url() {
        return this.callFrame.url;
    }
    get lineNumber() {
        return this.callFrame.lineNumber;
    }
    get columnNumber() {
        return this.callFrame.columnNumber;
    }
}
exports.ProfileNode = ProfileNode;
//# sourceMappingURL=chrome-devtools-types.js.map