package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.external.utils.S3Connection;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Signal;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.external.plugins.S3TestFixtures.ACCESS_KEY;
import static com.external.plugins.S3TestFixtures.MAPPER;
import static com.external.plugins.S3TestFixtures.awaitValue;
import static com.external.plugins.S3TestFixtures.datasource;
import static com.external.plugins.S3TestFixtures.describe;
import static com.external.plugins.S3TestFixtures.differences;
import static com.external.plugins.S3TestFixtures.queryParameters;
import static com.external.plugins.S3TestFixtures.readJsonResource;
import static com.external.plugins.S3TestFixtures.writeActual;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pins the unsigned and presigned URLs the plugin builds, offline, for every S3 service provider: the addressing style
 * (virtual-hosted or path-style), the scheme, port and path-style path prefix taken from the endpoint, the parts of the
 * endpoint that are dropped (query, fragment, user info), the key encoding, the signing region
 * each presigned URL is scoped to, and the datasource errors raised for endpoints a provider does not accept.
 *
 * <p>The expectations live in {@code src/test/resources/characterization/*.json}. Each run writes what it observed,
 * in the same format, to {@code target/characterization/} (relative to the module); a failure lists every differing
 * case. A difference is a change in what users get: a URL they share or store, or whether a datasource can be created.
 * When the change is intended, replace the expectation with the observed file, for example
 * {@code cp target/characterization/unsigned-urls.json src/test/resources/characterization/}, and review the diff.
 */
class AmazonS3PluginUrlCharacterizationTest {

    private static final List<String> BUCKETS = List.of("my-bucket", "my.dotted.bucket", "MyBucket", "my_bucket");

    private static final List<String> KEYS = List.of(
            "file.txt",
            "dir/sub/file.txt",
            "with space.txt",
            "a+b.txt",
            "100%.txt",
            "ünï/文件.txt",
            "q?a#b&c=d.txt",
            "/leading.txt",
            "trailing/",
            "tilde~star*.txt",
            "dir//double.txt",
            "semi;colon,comma@at$dollar!bang'quote(paren).txt");

    private static final List<String> SIGNED_KEYS =
            List.of("dir/file.txt", "with space+plus%.txt", "ünï/文件.txt", "/leading.txt");

    /** The query parameters of every presigned URL, in name order. */
    private static final List<String> PRESIGNED_QUERY_PARAMETERS = List.of(
            "X-Amz-Algorithm",
            "X-Amz-Credential",
            "X-Amz-Date",
            "X-Amz-Expires",
            "X-Amz-Signature",
            "X-Amz-SignedHeaders");

    private static final Duration PRESIGNED_URL_VALIDITY = Duration.ofMinutes(60);

    /** provider, then the endpoints exercised for it. Region is blank unless the case names one. */
    private static final Map<String, List<String>> ENDPOINTS = endpoints();

    private final AmazonS3Plugin.S3PluginExecutor executor = new AmazonS3Plugin.S3PluginExecutor();

    @Test
    void should_buildRecordedUnsignedUrls_when_everyProviderEndpointBucketAndKeyIsCombined() {
        // Given
        JsonNode expected = readJsonResource("/characterization/unsigned-urls.json");

        // When
        Map<String, Object> actual = new LinkedHashMap<>();
        ENDPOINTS.forEach((provider, endpoints) -> endpoints.forEach(endpoint -> actual.put(
                provider + " | " + endpoint, unsignedUrls(datasource(provider, endpoint, "", "default-bucket")))));
        writeActual("unsigned-urls.json", actual);

        // Then
        assertThat(differences(expected, MAPPER.valueToTree(actual))).isEmpty();
    }

    /**
     * Each presigned URL is recorded as its address (scheme, authority and path) and the region it is signed for. What
     * every presigned URL shares is checked here instead: its query parameters, algorithm, signed headers, credential
     * scope, validity, and an address identical to the unsigned URL of the same object.
     */
    @Test
    void should_buildRecordedPresignedUrls_when_everyCustomEndpointProviderIsUsed() {
        // Given
        JsonNode expected = readJsonResource("/characterization/presigned-urls.json");
        List<String> violations = new ArrayList<>();

        // When
        Map<String, Object> actual = new LinkedHashMap<>();
        for (String[] variant : presignVariants()) {
            String name = variant[0] + " | " + variant[1] + " | region=" + variant[2];
            actual.put(
                    name,
                    presignedUrls(datasource(variant[0], variant[1], variant[2], "default-bucket"), name, violations));
        }
        writeActual("presigned-urls.json", actual);

        // Then
        assertThat(violations).isEmpty();
        assertThat(differences(expected, MAPPER.valueToTree(actual))).isEmpty();
    }

    /**
     * Which datasource configurations produce a connection and which fail, with the plugin error (message and code)
     * each failure carries. The SDK's own wording, which reaches the user only as the downstream detail, is written to
     * {@code target/characterization/datasource-create-details.json} and not compared.
     */
    @Test
    void should_createOrRejectAsRecorded_when_datasourceConfigurationIsIncompleteOrInvalid() {
        // Given
        JsonNode expected = readJsonResource("/characterization/datasource-create-outcomes.json");

        // When
        Map<String, Object> actual = new LinkedHashMap<>();
        Map<String, Object> details = new LinkedHashMap<>();
        datasourceCases().forEach((name, configuration) -> {
            Signal<S3Connection> created = createSignal(configuration);
            if (created.isOnError()) {
                Throwable error = created.getThrowable();
                actual.put(name, describe(error));
                details.put(
                        name,
                        error instanceof AppsmithPluginException pluginException
                                ? pluginException.getDownstreamErrorMessage()
                                : error.toString());
            } else {
                executor.datasourceDestroy(created.get());
                actual.put(name, "ok");
            }
        });
        writeActual("datasource-create-outcomes.json", actual);
        writeActual("datasource-create-details.json", details);

        // Then
        assertThat(differences(expected, MAPPER.valueToTree(actual))).isEmpty();
    }

    private static Map<String, DatasourceConfiguration> datasourceCases() {
        Map<String, DatasourceConfiguration> cases = new LinkedHashMap<>();
        String minioEndpoint = "http://minio.example.com:9000";
        cases.put("amazon", datasource("amazon-s3", "ignored.example.com", "", ""));
        cases.put("amazon, no endpoints", withEndpoints(datasource("amazon-s3", "x", "", ""), null));
        cases.put("access key null", datasource("minio", minioEndpoint, "", "", null, S3TestFixtures.SECRET_KEY));
        cases.put("secret key null", datasource("minio", minioEndpoint, "", "", S3TestFixtures.ACCESS_KEY, null));
        cases.put("access key empty", datasource("minio", minioEndpoint, "", "", "", S3TestFixtures.SECRET_KEY));
        cases.put("secret key empty", datasource("minio", minioEndpoint, "", "", S3TestFixtures.ACCESS_KEY, ""));
        cases.put(
                "access key whitespace", datasource("minio", minioEndpoint, "", "", "   ", S3TestFixtures.SECRET_KEY));
        cases.put(
                "secret key whitespace", datasource("minio", minioEndpoint, "", "", S3TestFixtures.ACCESS_KEY, "   "));
        cases.put("amazon, access key null", datasource("amazon-s3", "", "", "", null, S3TestFixtures.SECRET_KEY));
        DatasourceConfiguration noProperties = datasource("minio", minioEndpoint, "", "");
        noProperties.setProperties(null);
        cases.put("properties null", noProperties);
        DatasourceConfiguration nullProvider = datasource("minio", minioEndpoint, "", "");
        nullProvider.getProperties().set(1, null);
        cases.put("provider property null", nullProvider);
        cases.put("provider empty", datasource("", minioEndpoint, "", ""));
        cases.put("provider unknown", datasource("backblaze", minioEndpoint, "", ""));
        cases.put("provider upper case", datasource("MINIO", minioEndpoint, "", ""));
        cases.put("minio, endpoints null", withEndpoints(datasource("minio", minioEndpoint, "", ""), null));
        cases.put("minio, endpoints empty", withEndpoints(datasource("minio", minioEndpoint, "", ""), List.of()));
        cases.put("minio, endpoint host null", datasource("minio", null, "", ""));
        cases.put("minio, endpoint host empty", datasource("minio", "", "", ""));
        cases.put("other, endpoint host null", datasource("other", null, "us-east-1", ""));
        cases.put("upcloud, endpoint host null", datasource("upcloud", null, "", ""));
        cases.put("other, endpoint with path", datasource("other", "https://objects.example.com/base/path", "", ""));
        cases.put("other, endpoint not a URI", datasource("other", "https://objects example.com", "", ""));
        cases.put("minio, region whitespace", datasource("minio", minioEndpoint, "   ", ""));
        DatasourceConfiguration minioNoRegion = datasource("minio", minioEndpoint, "", "");
        minioNoRegion.setProperties(
                new ArrayList<>(minioNoRegion.getProperties().subList(0, 2)));
        cases.put("minio, region property missing", minioNoRegion);
        DatasourceConfiguration otherNoRegion = datasource("other", "https://objects.example.com", "", "");
        otherNoRegion.setProperties(
                new ArrayList<>(otherNoRegion.getProperties().subList(0, 2)));
        cases.put("other, region property missing", otherNoRegion);
        DatasourceConfiguration noAuthentication = datasource("minio", minioEndpoint, "", "");
        noAuthentication.setAuthentication(null);
        cases.put("authentication null", noAuthentication);
        return cases;
    }

    private static DatasourceConfiguration withEndpoints(
            DatasourceConfiguration configuration, List<Endpoint> endpoints) {
        configuration.setEndpoints(endpoints);
        return configuration;
    }

    private Map<String, Object> unsignedUrls(DatasourceConfiguration configuration) {
        Map<String, Object> result = new LinkedHashMap<>();
        S3Connection connection = create(configuration, result);
        if (connection == null) {
            return result;
        }
        try {
            Map<String, String> urls = new LinkedHashMap<>();
            for (String bucket : BUCKETS) {
                List<String> keys = bucket.equals("my-bucket") ? KEYS : List.of("dir/file.txt");
                for (String key : keys) {
                    urls.put(bucket + " :: " + key, unsignedUrl(connection, bucket, key));
                }
            }
            result.put("urls", urls);
        } finally {
            executor.datasourceDestroy(connection);
        }
        return result;
    }

    private String unsignedUrl(S3Connection connection, String bucket, String key) {
        try {
            return executor.createFileUrl(connection, bucket, key);
        } catch (RuntimeException e) {
            return "THROWS " + e.getClass().getSimpleName() + ": " + e.getMessage();
        }
    }

    private Map<String, Object> presignedUrls(
            DatasourceConfiguration configuration, String caseName, List<String> violations) {
        Map<String, Object> result = new LinkedHashMap<>();
        S3Connection connection = create(configuration, result);
        if (connection == null) {
            return result;
        }
        try {
            Map<String, Object> urls = new LinkedHashMap<>();
            for (String bucket : List.of("my-bucket", "my.dotted.bucket", "MyBucket")) {
                for (String key : SIGNED_KEYS) {
                    String urlName = bucket + " :: " + key;
                    urls.put(urlName, presignedUrl(connection, bucket, key, caseName + " / " + urlName, violations));
                }
            }
            result.put("urls", urls);
        } finally {
            executor.datasourceDestroy(connection);
        }
        return result;
    }

    /** The URL's address and signing region, as {@code <address> signed for <region>}, or the error it throws. */
    private String presignedUrl(
            S3Connection connection, String bucket, String key, String caseName, List<String> violations) {
        Date expiry = Date.from(Instant.now().plus(PRESIGNED_URL_VALIDITY));
        String signedUrl;
        String unsignedUrl;
        try {
            signedUrl = executor.getSignedUrls(connection, bucket, new ArrayList<>(List.of(key)), expiry)
                    .get(0);
            unsignedUrl = executor.createFileUrl(connection, bucket, key);
        } catch (RuntimeException e) {
            return "THROWS " + e.getClass().getSimpleName() + ": " + e.getMessage();
        }
        URI signed = URI.create(signedUrl);
        String address = signed.getScheme() + "://" + signed.getRawAuthority() + signed.getRawPath();
        Map<String, String> query = queryParameters(signed);
        String[] credential = query.getOrDefault("X-Amz-Credential", "").split("/");
        checkShared(caseName, "address of the unsigned URL", unsignedUrl, address, violations);
        checkShared(
                caseName, "query parameters", PRESIGNED_QUERY_PARAMETERS, new ArrayList<>(query.keySet()), violations);
        checkShared(caseName, "algorithm", "AWS4-HMAC-SHA256", query.get("X-Amz-Algorithm"), violations);
        checkShared(caseName, "signed headers", "host", query.get("X-Amz-SignedHeaders"), violations);
        checkShared(caseName, "credential", 5, credential.length, violations);
        checkShared(caseName, "access key", ACCESS_KEY, credential[0], violations);
        checkShared(
                caseName,
                "service and terminator",
                "s3/aws4_request",
                credential.length == 5 ? credential[3] + "/" + credential[4] : null,
                violations);
        String expires = query.get("X-Amz-Expires");
        checkShared(
                caseName,
                "validity within one second of the requested",
                true,
                expires != null && Math.abs(Long.parseLong(expires) - PRESIGNED_URL_VALIDITY.toSeconds()) <= 1,
                violations);
        return address + " signed for " + (credential.length > 2 ? credential[2] : null);
    }

    private static void checkShared(
            String caseName, String what, Object expected, Object actual, List<String> violations) {
        if (!expected.equals(actual)) {
            violations.add(caseName + ": " + what + " " + expected + " <> " + actual);
        }
    }

    /** Creates a connection, or records the datasource error in {@code result} under "create" and returns null. */
    private S3Connection create(DatasourceConfiguration configuration, Map<String, Object> result) {
        Signal<S3Connection> created = createSignal(configuration);
        if (created.isOnError()) {
            result.put("create", describe(created.getThrowable()));
            return null;
        }
        result.put("create", "ok");
        return created.get();
    }

    /** The connection datasourceCreate emits, or the error it fails with. */
    private Signal<S3Connection> createSignal(DatasourceConfiguration configuration) {
        return awaitValue(executor.datasourceCreate(configuration).materialize());
    }

    private static List<String[]> presignVariants() {
        List<String[]> variants = new ArrayList<>();
        ENDPOINTS.forEach((provider, endpoints) -> {
            if (provider.equals("amazon-s3")) {
                return;
            }
            endpoints.forEach(endpoint -> variants.add(new String[] {provider, endpoint, ""}));
        });
        variants.add(new String[] {"minio", "http://minio.example.com:9000", "eu-west-3"});
        variants.add(new String[] {"minio", "http://minio.example.com:9000", "  "});
        variants.add(new String[] {"other", "https://objects.example.com", "us-west-2"});
        variants.add(new String[] {"other", "https://objects.example.com", "auto"});
        variants.add(new String[] {"other", "https://objects.example.com", "  "});
        variants.add(new String[] {"other", "https://objects.example.com", " eu-west-3 "});
        variants.add(new String[] {"other", "https://s3.eu-central-1.amazonaws.com", ""});
        variants.add(new String[] {"google-cloud-storage", "https://storage.googleapis.com", "us-west-2"});
        variants.add(new String[] {"upcloud", "appsmith.de-fra1.upcloudobjects.com", "ignored-region"});
        return variants;
    }

    private static Map<String, List<String>> endpoints() {
        Map<String, List<String>> endpoints = new LinkedHashMap<>();
        endpoints.put("amazon-s3", List.of("ignored.example.com"));
        endpoints.put(
                "upcloud",
                List.of(
                        "appsmith.de-fra1.upcloudobjects.com",
                        "https://appsmith.de-fra1.upcloudobjects.com",
                        "http://appsmith.de-fra1.upcloudobjects.com",
                        "appsmith.de-fra1.upcloudobjects.com:443",
                        "appsmith..de-fra1.upcloudobjects.com"));
        endpoints.put(
                "wasabi",
                List.of(
                        "s3.eu-central-1.wasabisys.com",
                        "https://s3.eu-central-1.wasabisys.com",
                        "s3.wasabisys.com",
                        "https://s3.eu-central-1.wasabisys.com/base/path"));
        endpoints.put(
                "digital-ocean-spaces",
                List.of(
                        "fra1.digitaloceanspaces.com",
                        "https://fra1.digitaloceanspaces.com",
                        "http://fra1.digitaloceanspaces.com"));
        endpoints.put("dream-objects", List.of("objects-us-east-1.dream.io", "https://objects-us-east-1.dream.io"));
        endpoints.put("minio", freeFormEndpoints("minio.example.com"));
        endpoints.put("google-cloud-storage", freeFormEndpoints("storage.googleapis.com"));
        endpoints.put("other", freeFormEndpoints("objects.example.com"));
        return endpoints;
    }

    private static List<String> freeFormEndpoints(String host) {
        return List.of(
                host,
                host + ":9000",
                "http://" + host + ":9000",
                "https://" + host,
                "https://" + host + "/",
                "10.0.0.5:9000",
                "http://10.0.0.5:9000",
                "http://[::1]:9000",
                "https://" + host + "/base/path",
                "https://" + host + "/base/path/",
                "http://10.0.0.5:9000/base/path",
                "http://10.0.0.5:9000/base/path/",
                "https://" + host + "?x=1",
                "https://" + host + "#frag",
                "https://endpoint-user:endpoint-pass@" + host,
                "https://endpoint-user:endpoint-pass@" + host + ":9000/base/path/?x=1#frag",
                "//" + host);
    }
}
