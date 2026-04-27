import axios from "axios";
import http from "http";

describe("axios NO_PROXY normalization", () => {
  const originalHttpProxy = process.env.HTTP_PROXY;
  const originalNoProxy = process.env.NO_PROXY;

  afterEach(() => {
    if (originalHttpProxy === undefined) {
      delete process.env.HTTP_PROXY;
    } else {
      process.env.HTTP_PROXY = originalHttpProxy;
    }

    if (originalNoProxy === undefined) {
      delete process.env.NO_PROXY;
    } else {
      process.env.NO_PROXY = originalNoProxy;
    }
  });

  it("does not proxy localhost variants when NO_PROXY includes loopback hosts", async () => {
    const proxiedRequests: string[] = [];
    const proxyServer = http.createServer((req, res) => {
      proxiedRequests.push(`${req.method} ${req.url ?? ""}`);
      res.statusCode = 200;
      res.end("proxied");
    });

    await new Promise<void>((resolve) =>
      proxyServer.listen(0, "127.0.0.1", resolve),
    );
    const address = proxyServer.address();

    if (!address || typeof address === "string") {
      proxyServer.close();
      throw new Error("Failed to bind proxy server");
    }

    process.env.HTTP_PROXY = `http://127.0.0.1:${address.port}`;
    process.env.NO_PROXY = "localhost,127.0.0.1,::1";

    await axios
      .get("http://localhost.:65534", { timeout: 300 })
      .catch(() => null);
    await axios.get("http://[::1]:65534", { timeout: 300 }).catch(() => null);

    await new Promise<void>((resolve, reject) => {
      proxyServer.close((error) => (error ? reject(error) : resolve()));
    });

    expect(proxiedRequests).toHaveLength(0);
  });
});
