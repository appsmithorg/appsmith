import tern, { Server, Def } from "tern";

let server: Server;

let nextId = 0;
const pending: { [x: number]: (...args: any) => any } = {};

self.onmessage = function(e) {
  const data = e.data;
  switch (data.type) {
    case "init":
      return startServer(data.defs, data.plugins, data.scripts);
    case "add":
      return server.addFile(data.name, data.text);
    case "del":
      return server.delFile(data.name);
    case "req":
      return server.request(data.body, function(err, reqData) {
        postMessage({ id: data.id, body: reqData, err: err && String(err) });
      });
    case "getFile":
      const c = pending[data.id];
      delete pending[data.id];
      return c(data.err, data.text);
    case "delete_def":
      return server.deleteDefs(data.name);
    case "add_def":
      return server.addDefs(data.defs);
    default:
      throw new Error("Unknown message type: " + data.type);
  }
};

function getFile(file: string, c: (...args: any) => any) {
  postMessage({ type: "getFile", name: file, id: ++nextId });
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
    postMessage({ type: "debug", message: v });
  },
};
