import tern, { Server, Def } from "tern";
import { CallbackFn, TernWorkerAction } from "utils/autocomplete/types";

let server: Server;

let nextId = 0;
const pending: { [x: number]: CallbackFn } = {};

self.onmessage = function(e) {
  const data = e.data;
  switch (data.type) {
    case TernWorkerAction.INIT:
      return startServer(data.defs, data.plugins, data.scripts);
    case TernWorkerAction.ADD_FILE:
      return server.addFile(data.name, data.text);
    case TernWorkerAction.DELETE_FILE:
      return server.delFile(data.name);
    case TernWorkerAction.REQUEST:
      return server.request(data.body, function(err, reqData) {
        postMessage({ id: data.id, body: reqData, err: err && String(err) });
      });
    case TernWorkerAction.GET_FILE:
      const c = pending[data.id];
      delete pending[data.id];
      return c(data.err, data.text);
    case TernWorkerAction.DELETE_DEF:
      return server.deleteDefs(data.name);
    case TernWorkerAction.ADD_DEF:
      return server.addDefs(data.defs);
    default:
      throw new Error("Unknown message type: " + data.type);
  }
};

function getFile(file: string, c: CallbackFn) {
  postMessage({ type: TernWorkerAction.GET_FILE, name: file, id: ++nextId });
  pending[nextId] = c;
}

function startServer(defs: Def[], plugins = {}, scripts?: string[]) {
  //@ts-expect-error test
  if (scripts) self.importScripts.apply(null, scripts);

  server = new tern.Server({
    getFile: getFile,
    async: true,
    defs: defs,
    plugins: plugins,
  });
}

self.console = {
  ...self.console,
  log: function(v) {
    postMessage({ type: TernWorkerAction.DEBUG, message: v });
  },
};
