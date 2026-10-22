// An upstream that waits before sending response headers, to test proxy timeouts.
// The wait is `?delay=<ms>`, defaulting to 4000.
import * as http from "http"

http.createServer((req, res) => {
  const delay = parseInt(new URL(req.url, "http://localhost").searchParams.get("delay") || "4000", 10)
  setTimeout(() => {
    res.writeHead(200, {"Content-Type": "text/plain"})
    res.end(`slow response after ${delay}ms\n`)
  }, delay)
}).listen(5051, "127.0.0.1")
