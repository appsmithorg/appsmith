const queue: Array<() => Promise<any>> = [];

export function preexecuteChunk(importFn: () => Promise<any>) {
  queue.push(importFn);
}

export async function executePreexecuteQueue() {
  const loadChunk = async () => {
    const importFn = queue.shift();
    if (!importFn) {
      return;
    }

    console.log("Pre-executing import", importFn);
    await importFn();

    requestIdleCallback(loadChunk);
  };

  requestIdleCallback(loadChunk);
}
