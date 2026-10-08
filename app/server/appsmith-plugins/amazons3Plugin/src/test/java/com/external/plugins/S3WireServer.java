package com.external.plugins;

import mockwebserver3.Dispatcher;
import mockwebserver3.MockResponse;
import mockwebserver3.MockWebServer;
import mockwebserver3.RecordedRequest;
import mockwebserver3.SocketPolicy;
import okio.Buffer;

import javax.net.ssl.SSLSocketFactory;
import java.io.ByteArrayOutputStream;
import java.io.Closeable;
import java.io.IOException;
import java.net.InetAddress;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * A local HTTP server, bound to 127.0.0.1, that answers like S3 and records every request it receives. Requests are
 * routed by a handler the test supplies; {@link #requests()} returns them in arrival order with the aws-chunked framing
 * (if any) removed from the payload. Virtual-hosted requests for {@code <bucket>.localhost} reach it through {@link
 * LoopbackSubdomainResolverProvider}.
 */
final class S3WireServer implements Closeable {

    private static final Pattern CREDENTIAL_SCOPE =
            Pattern.compile("Credential=[^/]+/\\d{8}/([^/]*)/([^/]*)/([^,]*),\\s*SignedHeaders=([^,]+),");

    private final MockWebServer server = new MockWebServer();
    private final List<Request> requests = Collections.synchronizedList(new ArrayList<>());
    private final String scheme;
    private volatile Function<Request, MockResponse> handler = request -> new MockResponse().setResponseCode(500);

    S3WireServer() throws IOException {
        this(null);
    }

    /** A server that speaks TLS with the given socket factory, or plain HTTP when it is null. */
    S3WireServer(SSLSocketFactory tlsSocketFactory) throws IOException {
        scheme = tlsSocketFactory == null ? "http" : "https";
        if (tlsSocketFactory != null) {
            server.useHttps(tlsSocketFactory, false);
        }
        server.setDispatcher(new Dispatcher() {
            @Override
            public MockResponse dispatch(RecordedRequest recorded) {
                Request request = Request.of(recorded);
                requests.add(request);
                return handler.apply(request);
            }

            @Override
            public MockResponse peek() {
                // Answer "Expect: 100-continue" so request bodies are sent without waiting for the client's timeout.
                return new MockResponse().setSocketPolicy(SocketPolicy.CONTINUE_ALWAYS);
            }
        });
        server.start(InetAddress.getByName("127.0.0.1"), 0);
    }

    /** The endpoint to configure on the datasource: {@code http(s)://localhost:<port>}. */
    String endpoint() {
        return scheme + "://localhost:" + server.getPort();
    }

    String scheme() {
        return scheme;
    }

    String hostAndPort() {
        return "localhost:" + server.getPort();
    }

    /** The server's address as an IP literal: {@code 127.0.0.1:<port>}. */
    String ipAndPort() {
        return "127.0.0.1:" + server.getPort();
    }

    void respond(Function<Request, MockResponse> handler) {
        this.handler = handler;
    }

    List<Request> requests() {
        synchronized (requests) {
            return new ArrayList<>(requests);
        }
    }

    void clear() {
        requests.clear();
    }

    @Override
    public void close() throws IOException {
        server.shutdown();
    }

    /** One request as received, with its payload decoded from aws-chunked framing when the request used it. */
    record Request(
            String method,
            String host,
            String path,
            Map<String, String> query,
            Map<String, List<String>> headers,
            byte[] rawBody,
            byte[] payload,
            List<Integer> httpChunkSizes) {

        static Request of(RecordedRequest recorded) {
            Map<String, List<String>> headers = new TreeMap<>();
            for (String name : recorded.getHeaders().names()) {
                headers.put(name.toLowerCase(Locale.ROOT), recorded.getHeaders().values(name));
            }
            String target = recorded.getPath();
            int queryStart = target.indexOf('?');
            String path = queryStart < 0 ? target : target.substring(0, queryStart);
            Map<String, String> query = new TreeMap<>();
            if (queryStart >= 0) {
                for (String pair : target.substring(queryStart + 1).split("&")) {
                    if (pair.isEmpty()) {
                        continue;
                    }
                    int separator = pair.indexOf('=');
                    String name = separator < 0 ? pair : pair.substring(0, separator);
                    String value = separator < 0 ? null : pair.substring(separator + 1);
                    query.put(name, value);
                }
            }
            byte[] rawBody = recorded.getBody().readByteArray();
            String contentEncoding = first(headers, "content-encoding");
            String contentSha = first(headers, "x-amz-content-sha256");
            boolean awsChunked = (contentEncoding != null && contentEncoding.contains("aws-chunked"))
                    || (contentSha != null && contentSha.startsWith("STREAMING-"));
            byte[] payload = awsChunked ? decodeAwsChunked(rawBody) : rawBody;
            return new Request(
                    recorded.getMethod(),
                    first(headers, "host"),
                    path,
                    query,
                    headers,
                    rawBody,
                    payload,
                    recorded.getChunkSizes());
        }

        String header(String name) {
            return first(headers, name.toLowerCase(Locale.ROOT));
        }

        String payloadUtf8() {
            return new String(payload, StandardCharsets.UTF_8);
        }

        /** The object key addressed by this request for the given bucket, decoded, whichever addressing style. */
        String key(String bucket) {
            String rawKey;
            if (host != null && host.startsWith(bucket + ".")) {
                rawKey = path.substring(1);
            } else {
                rawKey = path.substring(("/" + bucket + "/").length());
            }
            return URLDecoder.decode(rawKey.replace("+", "%2B"), StandardCharsets.UTF_8);
        }

        boolean isVirtualHosted(String bucket) {
            return host != null && host.startsWith(bucket + ".");
        }
    }

    private static String first(Map<String, List<String>> headers, String name) {
        List<String> values = headers.get(name);
        return values == null || values.isEmpty() ? null : values.get(0);
    }

    /** Strips aws-chunked framing ({@code <hex-size>[;chunk-signature=...]\r\n<data>\r\n ... 0...\r\n[trailers]}). */
    static byte[] decodeAwsChunked(byte[] body) {
        ByteArrayOutputStream payload = new ByteArrayOutputStream();
        int position = 0;
        while (position < body.length) {
            int lineEnd = indexOfCrlf(body, position);
            if (lineEnd < 0) {
                break;
            }
            String header = new String(body, position, lineEnd - position, StandardCharsets.US_ASCII);
            int semicolon = header.indexOf(';');
            String sizeHex = (semicolon < 0 ? header : header.substring(0, semicolon)).trim();
            int size;
            try {
                size = Integer.parseInt(sizeHex, 16);
            } catch (NumberFormatException e) {
                return body;
            }
            position = lineEnd + 2;
            if (size == 0) {
                break;
            }
            payload.write(body, position, size);
            position += size + 2;
        }
        return payload.toByteArray();
    }

    private static int indexOfCrlf(byte[] body, int from) {
        for (int i = from; i + 1 < body.length; i++) {
            if (body[i] == '\r' && body[i + 1] == '\n') {
                return i;
            }
        }
        return -1;
    }

    /** The Authorization header reduced to its scheme, credential scope and signed headers. */
    static String authorizationSummary(String authorization) {
        String scheme = authorization.split(" ", 2)[0];
        Matcher matcher = CREDENTIAL_SCOPE.matcher(authorization);
        if (!matcher.find()) {
            return scheme + " <unparsed>";
        }
        return scheme + " region=" + matcher.group(1) + " service=" + matcher.group(2) + " terminator="
                + matcher.group(3) + " signedHeaders=" + matcher.group(4);
    }

    // ----- canned S3 responses -----

    /**
     * A response that is not an S3 error document, as a proxy, load balancer or firewall in front of the service
     * sends: the given status line, and the body with its content type when the body is not null.
     */
    static MockResponse nonS3Error(String statusLine, String contentType, String body) {
        MockResponse response = new MockResponse().setStatus(statusLine);
        if (body != null) {
            response.addHeader("Content-Type", contentType).setBody(body);
        }
        return response;
    }

    static MockResponse xml(int status, String body) {
        return new MockResponse()
                .setResponseCode(status)
                .addHeader("Content-Type", "application/xml")
                .addHeader("x-amz-request-id", "REQ123")
                .setBody(body);
    }

    static MockResponse error(int status, String code, String message) {
        return xml(
                status,
                "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Error><Code>" + code + "</Code><Message>" + message
                        + "</Message><RequestId>REQ123</RequestId><HostId>HOST123</HostId></Error>");
    }

    static MockResponse noContent() {
        return new MockResponse().setResponseCode(204).addHeader("x-amz-request-id", "REQ123");
    }

    /** 200 for a PUT, with the ETag S3 computes for a single-part upload: the hex MD5 of the payload. */
    static MockResponse putOk(Request request) {
        return new MockResponse()
                .setResponseCode(200)
                .addHeader("ETag", "\"" + S3TestFixtures.md5Hex(request.payload()) + "\"")
                .addHeader("x-amz-request-id", "REQ123")
                .addHeader("Content-Length", "0");
    }

    static MockResponse object(byte[] content, String etag) {
        return new MockResponse()
                .setResponseCode(200)
                .addHeader("Content-Type", "application/octet-stream")
                .addHeader("ETag", "\"" + etag + "\"")
                .addHeader("Last-Modified", "Thu, 01 Jan 2026 00:00:00 GMT")
                .addHeader("x-amz-request-id", "REQ123")
                .setBody(new Buffer().write(content));
    }

    /**
     * A ListObjects (version 1) page that echoes the request's prefix. Keys and prefix are URL-encoded and EncodingType
     * is echoed when the request asked for {@code encoding-type=url}, as S3 does. No NextMarker is sent, as S3 does when
     * no delimiter is given.
     */
    static MockResponse listPage(Request request, String bucket, List<String> keys, boolean truncated) {
        return listPage(request, bucket, keys, truncated, null);
    }

    /**
     * A ListObjects (version 1) page as {@link #listPage(Request, String, List, boolean)} builds it, plus the given
     * NextMarker, encoded like the keys, when it is not null.
     */
    static MockResponse listPage(
            Request request, String bucket, List<String> keys, boolean truncated, String nextMarker) {
        boolean urlEncoded = "url".equals(request.query().get("encoding-type"));
        String prefix = URLDecoder.decode(request.query().getOrDefault("prefix", ""), StandardCharsets.UTF_8);
        StringBuilder body = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?>")
                .append("<ListBucketResult xmlns=\"http://s3.amazonaws.com/doc/2006-03-01/\">")
                .append("<Name>")
                .append(bucket)
                .append("</Name><Prefix>")
                .append(urlEncoded ? listingEncoded(prefix) : prefix)
                .append("</Prefix><Marker></Marker><MaxKeys>1000</MaxKeys>");
        if (urlEncoded) {
            body.append("<EncodingType>url</EncodingType>");
        }
        body.append("<IsTruncated>").append(truncated).append("</IsTruncated>");
        if (nextMarker != null) {
            body.append("<NextMarker>")
                    .append(urlEncoded ? listingEncoded(nextMarker) : nextMarker)
                    .append("</NextMarker>");
        }
        for (String key : keys) {
            String listedKey = urlEncoded ? listingEncoded(key) : key;
            body.append("<Contents><Key>")
                    .append(listedKey)
                    .append("</Key><LastModified>2026-01-01T00:00:00.000Z</LastModified>")
                    .append("<ETag>&quot;d41d8cd98f00b204e9800998ecf8427e&quot;</ETag><Size>0</Size>")
                    .append("<StorageClass>STANDARD</StorageClass></Contents>");
        }
        body.append("</ListBucketResult>");
        return xml(200, body.toString());
    }

    /** A key or prefix encoded as S3 lists it with {@code encoding-type=url}: slashes are kept. */
    private static String listingEncoded(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8)
                .replace("+", "%20")
                .replace("%2F", "/");
    }

    static MockResponse listBuckets(List<String> buckets) {
        StringBuilder body = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?>")
                .append("<ListAllMyBucketsResult xmlns=\"http://s3.amazonaws.com/doc/2006-03-01/\">")
                .append("<Owner><ID>owner</ID><DisplayName>owner</DisplayName></Owner><Buckets>");
        for (String bucket : buckets) {
            body.append("<Bucket><Name>")
                    .append(bucket)
                    .append("</Name><CreationDate>2026-01-01T00:00:00.000Z</CreationDate></Bucket>");
        }
        body.append("</Buckets></ListAllMyBucketsResult>");
        return xml(200, body.toString());
    }

    /** The keys named in a DeleteObjects request body. */
    static List<String> deleteKeys(Request request) {
        List<String> keys = new ArrayList<>();
        Matcher matcher = Pattern.compile("<Key>([^<]*)</Key>").matcher(request.payloadUtf8());
        while (matcher.find()) {
            keys.add(matcher.group(1));
        }
        return keys;
    }

    /** A DeleteObjects result that reports the given keys as deleted and the others with an AccessDenied error. */
    static MockResponse deleteResult(List<String> deleted, List<String> failed) {
        return deleteResult(deleted, failed, "Access Denied");
    }

    /** A DeleteObjects result like {@link #deleteResult(List, List)}, with the given message on each error. */
    static MockResponse deleteResult(List<String> deleted, List<String> failed, String message) {
        StringBuilder body = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?>")
                .append("<DeleteResult xmlns=\"http://s3.amazonaws.com/doc/2006-03-01/\">");
        for (String key : deleted) {
            body.append("<Deleted><Key>").append(key).append("</Key></Deleted>");
        }
        for (String key : failed) {
            body.append("<Error><Key>")
                    .append(key)
                    .append("</Key><Code>AccessDenied</Code><Message>")
                    .append(message)
                    .append("</Message></Error>");
        }
        body.append("</DeleteResult>");
        return xml(200, body.toString());
    }
}
