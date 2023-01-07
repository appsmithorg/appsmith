self.addEventListener('fetch', function (event) {
    if (event.request.url.indexOf('/windowProxy/') !== -1) {
        console.log("Intercepted request for " + event.request);
        const response = event.request.json().then((reqJSON) => {
            return new Promise(function (resolve, reject) {
                var channel = new MessageChannel();
                channel.port1.onmessage = function (event) {
                    console.log("Received response for :");
                    console.log({ res: event.data });
                    if (event.data.error) {
                        reject(event.data.error);
                    } else {
                        resolve(new Response(JSON.stringify(event.data)));
                    }
                    channel.port1.close();
                    channel.port2.close();
                };
                self.clients.matchAll({
                    includeUncontrolled: true,
                    type: 'window',
                }).then((clients) => {
                    if (clients && clients.length) {
                        clients[0].postMessage(
                            reqJSON, [channel.port2]
                        );
                    }
                });
            })
        });
        event.respondWith(response);
    }
});