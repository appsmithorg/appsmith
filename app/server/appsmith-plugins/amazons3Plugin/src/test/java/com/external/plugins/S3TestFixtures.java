package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.util.DefaultIndenter;
import com.fasterxml.jackson.core.util.DefaultPrettyPrinter;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.concurrent.atomic.AtomicReference;
import java.util.zip.CRC32;

import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static org.assertj.core.api.Assertions.assertThat;

/** Datasource, action and JSON helpers shared by the S3 plugin tests that drive the plugin's public entrypoints. */
final class S3TestFixtures {

    static final String AMAZON = "amazon-s3";
    static final String MINIO = "minio";
    static final String GCS = "google-cloud-storage";
    static final String OTHER = "other";

    static final String BUCKET_NAME = "my-bucket";

    static final String ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE";
    static final String SECRET_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";

    static final ObjectMapper MAPPER = new ObjectMapper();

    private static final Path ACTUAL_OUTPUT_DIR = Path.of("target", "characterization");

    /** Upper bound for one plugin call against a local server, retries included. */
    private static final Duration CALL_TIMEOUT = Duration.ofSeconds(60);

    private S3TestFixtures() {}

    static DatasourceConfiguration datasource(String provider, String endpoint, String region, String defaultBucket) {
        return datasource(provider, endpoint, region, defaultBucket, ACCESS_KEY, SECRET_KEY);
    }

    static DatasourceConfiguration datasource(
            String provider, String endpoint, String region, String defaultBucket, String accessKey, String secretKey) {
        DBAuth authentication = new DBAuth();
        authentication.setAuthType(DBAuth.Type.USERNAME_PASSWORD);
        authentication.setUsername(accessKey);
        authentication.setPassword(secretKey);

        DatasourceConfiguration configuration = new DatasourceConfiguration();
        configuration.setAuthentication(authentication);
        ArrayList<Property> properties = new ArrayList<>();
        properties.add(null); // index 0 is not used.
        properties.add(new Property("s3Provider", provider));
        properties.add(new Property("customRegion", region));
        properties.add(new Property("default bucket", defaultBucket));
        configuration.setProperties(properties);
        configuration.setEndpoints(List.of(new Endpoint(endpoint, null)));
        return configuration;
    }

    /** An action whose form data holds the given fields, keyed by the plugin's form field names. */
    static ActionConfiguration action(Map<String, Object> fields) {
        Map<String, Object> formData = new HashMap<>();
        fields.forEach((key, value) -> setDataValueSafelyInFormData(formData, key, value));
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(formData);
        return actionConfiguration;
    }

    static ExecuteActionDTO noParams() {
        return new ExecuteActionDTO();
    }

    /** The single value the Mono emits, verified with StepVerifier: it must emit one value and complete. */
    static <T> T awaitValue(Mono<T> mono) {
        AtomicReference<T> value = new AtomicReference<>();
        StepVerifier.create(mono).consumeNextWith(value::set).expectComplete().verify(CALL_TIMEOUT);
        return value.get();
    }

    /** Query parameters in name order, decoded. */
    static Map<String, String> queryParameters(URI uri) {
        Map<String, String> parameters = new TreeMap<>();
        if (uri.getRawQuery() == null) {
            return parameters;
        }
        for (String pair : uri.getRawQuery().split("&")) {
            int separator = pair.indexOf('=');
            String name = separator < 0 ? pair : pair.substring(0, separator);
            String value = separator < 0 ? "" : pair.substring(separator + 1);
            parameters.put(
                    URLDecoder.decode(name, StandardCharsets.UTF_8), URLDecoder.decode(value, StandardCharsets.UTF_8));
        }
        return parameters;
    }

    /** The signing region named in a presigned URL's credential scope. */
    static String credentialScopeRegion(String signedUrl) {
        return queryParameters(URI.create(signedUrl)).get("X-Amz-Credential").split("/")[2];
    }

    /** The error's type and message, plus the plugin error code and title for a plugin error. */
    static String describe(Throwable error) {
        String description = error.getClass().getSimpleName() + ": " + error.getMessage();
        if (error instanceof AppsmithPluginException pluginException) {
            description += " [" + pluginException.getAppErrorCode() + " " + pluginException.getTitle() + "]";
        }
        return description;
    }

    static String md5Base64(byte[] payload) {
        return Base64.getEncoder().encodeToString(digest("MD5", payload));
    }

    static String md5Hex(byte[] payload) {
        return HexFormat.of().formatHex(digest("MD5", payload));
    }

    static String sha256Hex(byte[] payload) {
        return HexFormat.of().formatHex(digest("SHA-256", payload));
    }

    private static byte[] digest(String algorithm, byte[] payload) {
        try {
            return MessageDigest.getInstance(algorithm).digest(payload);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    /**
     * A bulk delete carries the Content-MD5 that S3-compatible services require, plus the CRC32 header the SDK adds
     * to operations that require a checksum. The CRC32 travels in a header, never in a trailer or aws-chunked body.
     */
    static void assertBulkDeleteChecksums(S3WireServer.Request delete) {
        assertThat(delete.header("Content-MD5")).isEqualTo(md5Base64(delete.payload()));
        assertThat(delete.header("x-amz-sdk-checksum-algorithm")).isEqualTo("CRC32");
        assertThat(delete.header("x-amz-checksum-crc32")).isEqualTo(crc32Base64(delete.payload()));
        assertThat(delete.headers().keySet()).doesNotContain("x-amz-trailer", "content-encoding");
        assertThat(delete.rawBody()).isEqualTo(delete.payload());
    }

    private static String crc32Base64(byte[] payload) {
        CRC32 crc32 = new CRC32();
        crc32.update(payload);
        long value = crc32.getValue();
        byte[] bigEndian = {(byte) (value >>> 24), (byte) (value >>> 16), (byte) (value >>> 8), (byte) value};
        return Base64.getEncoder().encodeToString(bigEndian);
    }

    static byte[] utf8(String text) {
        return text.getBytes(StandardCharsets.UTF_8);
    }

    static byte[] allByteValues() {
        byte[] bytes = new byte[256];
        for (int i = 0; i < bytes.length; i++) {
            bytes[i] = (byte) i;
        }
        return bytes;
    }

    static JsonNode readJsonResource(String resource) {
        try (InputStream in = S3TestFixtures.class.getResourceAsStream(resource)) {
            assertThat(in).as("test resource " + resource).isNotNull();
            return MAPPER.readTree(in);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /**
     * Writes what a characterization test observed to {@code target/characterization/<name>}, in the format of the
     * recorded expectations under {@code src/test/resources/characterization}: two-space indentation, one array element
     * per line, a newline at the end. A recorded expectation is replaced by copying this file over it.
     */
    static void writeActual(String name, Object value) {
        try {
            Path file = ACTUAL_OUTPUT_DIR.resolve(name);
            Files.createDirectories(file.getParent());
            String json = MAPPER.writer(new RecordedJsonPrettyPrinter()).writeValueAsString(value);
            Files.writeString(file, json + "\n", StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /**
     * Every field whose value differs between the two object trees, as {@code path: expected <> actual}. Both trees
     * are maps of maps down to string or scalar leaves.
     */
    static List<String> differences(JsonNode expected, JsonNode actual) {
        List<String> differences = new ArrayList<>();
        collectDifferences("", expected, actual, differences);
        return differences;
    }

    private static void collectDifferences(String path, JsonNode expected, JsonNode actual, List<String> out) {
        if (expected != null && actual != null && expected.isObject() && actual.isObject()) {
            for (Iterator<String> names = expected.fieldNames(); names.hasNext(); ) {
                String name = names.next();
                collectDifferences(path + " / " + name, expected.get(name), actual.get(name), out);
            }
            for (Iterator<String> names = actual.fieldNames(); names.hasNext(); ) {
                String name = names.next();
                if (!expected.has(name)) {
                    out.add(path + " / " + name + ": <absent> <> " + actual.get(name));
                }
            }
            return;
        }
        if (expected == null || !expected.equals(actual)) {
            out.add(path + ": " + expected + " <> " + actual);
        }
    }

    /** Two-space indentation for objects and arrays, and {@code "name": value} without a space before the colon. */
    private static final class RecordedJsonPrettyPrinter extends DefaultPrettyPrinter {

        RecordedJsonPrettyPrinter() {
            DefaultIndenter indenter = new DefaultIndenter("  ", "\n");
            indentObjectsWith(indenter);
            indentArraysWith(indenter);
        }

        private RecordedJsonPrettyPrinter(RecordedJsonPrettyPrinter base) {
            super(base);
        }

        @Override
        public DefaultPrettyPrinter createInstance() {
            return new RecordedJsonPrettyPrinter(this);
        }

        @Override
        public void writeObjectFieldValueSeparator(JsonGenerator generator) throws IOException {
            generator.writeRaw(": ");
        }
    }
}
