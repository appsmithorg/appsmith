import { Def, Server } from "tern";

const ternWorker = new Worker(
  new URL("../../workers/Tern/tern.worker.ts", import.meta.url),
  {
    name: "TernWorker",
    type: "module",
  },
);

function getFile(ts: any, name: string, c: (...args: any) => void) {
  const buf = ts.docs[name];
  if (buf) c(ts.docValue(ts, buf));
  else if (ts.options.getFile) ts.options.getFile(name, c);
  else c(null);
}

type TernWorkerServerConstructor = {
  (ts: any): void;
  new (ts: any): Server;
};

function TernWorkerServer(this: any, ts: any) {
  const worker = (ts.worker = ternWorker);
  worker.postMessage({
    type: "init",
    defs: ts.options.defs,
    plugins: ts.options.plugins,
    scripts: ts.options.workerDeps,
  });
  let msgId = 0;
  let pending: { [x: number]: (...args: any) => any } = {};

  function send(data: any, c?: (...args: any) => any) {
    if (c) {
      data.id = ++msgId;
      pending[msgId] = c;
    }
    worker.postMessage(data);
  }
  worker.onmessage = function(e) {
    const data = e.data;
    if (data.type == "getFile") {
      getFile(ts, data.name, function(err, text) {
        send({ type: "getFile", err: String(err), text: text, id: data.id });
      });
    } else if (data.type == "debug") {
      window.console.log(data.message);
    } else if (data.id && pending[data.id]) {
      pending[data.id](data.err, data.body);
      delete pending[data.id];
    }
  };
  worker.onerror = function(e) {
    for (const id in pending) pending[id](e);
    pending = {};
  };

  this.addFile = function(name: string, text: string) {
    send({ type: "add", name: name, text: text });
  };
  this.delFile = function(name: string) {
    send({ type: "del", name: name });
  };
  this.request = function(body: any, c: (...args: any) => any) {
    send({ type: "req", body: body }, c);
  };
  this.addDefs = function(defs: Def) {
    send({ type: "add_def", defs });
  };
  this.deleteDefs = function(name: string) {
    send({ type: "delete_def", name });
  };
}

export default TernWorkerServer as TernWorkerServerConstructor;
