package com.external.utils;

import com.external.utils.DatasourceUtils.S3ConnectionSettings;
import lombok.extern.slf4j.Slf4j;
import software.amazon.awssdk.awscore.exception.AwsErrorDetails;
import software.amazon.awssdk.awscore.exception.AwsServiceException;
import software.amazon.awssdk.core.checksums.RequestChecksumCalculation;
import software.amazon.awssdk.core.checksums.ResponseChecksumValidation;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.http.apache.ApacheHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.LegacyMd5Plugin;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

/**
 * A datasource's connection to an S3 service: the client that runs every S3 operation, and the presigners that sign
 * GET URLs with the same credentials, endpoint and addressing style. Both are built from one {@link
 * S3ConnectionSettings}. Closing the connection releases the client's HTTP connection pool and the presigners.
 */
@Slf4j
public class S3Connection implements AutoCloseable {

    /** Read timeout of the HTTP client. */
    private static final Duration HTTP_SOCKET_TIMEOUT = Duration.ofSeconds(50);

    /** Connect timeout of the HTTP client. */
    private static final Duration HTTP_CONNECTION_TIMEOUT = Duration.ofSeconds(10);

    /** Response header in which S3 reports a bucket's region, on success and on error responses alike. */
    private static final String BUCKET_REGION_HEADER = "x-amz-bucket-region";

    /** Signature validity used to address an object for its unsigned URL; the signature itself is discarded. */
    private static final Duration UNSIGNED_URL_SIGNATURE_DURATION = Duration.ofMinutes(1);

    /** Most buckets whose region a connection keeps; the least recently used is dropped first. */
    static final int MAX_KNOWN_BUCKET_REGIONS = 300;

    /** Message of the error a presigned or unsigned URL fails with once the connection is closed. */
    static final String CLOSED_MESSAGE = "The S3 connection is closed.";

    private final S3ConnectionSettings settings;
    private final S3Client client;
    private volatile boolean closed;
    private final Map<Region, S3Presigner> presigners = new ConcurrentHashMap<>();
    private final Map<String, Region> bucketRegions = Collections.synchronizedMap(new LinkedHashMap<>(16, 0.75f, true) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, Region> eldest) {
            return size() > MAX_KNOWN_BUCKET_REGIONS;
        }
    });

    S3Connection(S3ConnectionSettings settings, S3Client client) {
        this.settings = settings;
        this.client = client;
    }

    static S3Connection open(S3ConnectionSettings settings) {
        return new S3Connection(settings, buildClient(settings));
    }

    /**
     * Payload checksums are added only where an operation requires one, which is bulk delete: it carries Content-MD5
     * and a CRC32 checksum header. Response checksums are validated only where an operation requires it: several
     * S3-compatible services reject or ignore the CRC checksum headers and trailers that the SDK would otherwise send.
     * The HTTP client is passed as a builder so that the S3 client owns its connection pool and releases it in close().
     */
    private static S3Client buildClient(S3ConnectionSettings settings) {
        S3ClientBuilder builder = S3Client.builder()
                .region(settings.region())
                .credentialsProvider(settings.credentialsProvider())
                .serviceConfiguration(serviceConfiguration(settings))
                .requestChecksumCalculation(RequestChecksumCalculation.WHEN_REQUIRED)
                .responseChecksumValidation(ResponseChecksumValidation.WHEN_REQUIRED)
                .addPlugin(LegacyMd5Plugin.create())
                .httpClientBuilder(httpClientBuilder(HTTP_SOCKET_TIMEOUT, HTTP_CONNECTION_TIMEOUT));
        if (settings.endpoint() != null) {
            builder.endpointOverride(settings.endpoint());
        }
        if (settings.resolveBucketRegions()) {
            builder.crossRegionAccessEnabled(true);
        }
        return builder.build();
    }

    /** The proxy comes from the https proxy settings; see {@link AwsHttpsProxyConfiguration}. */
    static ApacheHttpClient.Builder httpClientBuilder(Duration socketTimeout, Duration connectionTimeout) {
        return AwsHttpsProxyConfiguration.configure(
                ApacheHttpClient.builder().socketTimeout(socketTimeout).connectionTimeout(connectionTimeout));
    }

    /**
     * Addressing style, plus the ARN-region and multi-region options set to their defaults explicitly: left unset,
     * the presigner reads them from the AWS profile files on every presigned URL.
     */
    private static S3Configuration serviceConfiguration(S3ConnectionSettings settings) {
        return S3Configuration.builder()
                .pathStyleAccessEnabled(settings.pathStyleAccess())
                .useArnRegionEnabled(false)
                .multiRegionEnabled(true)
                .build();
    }

    public S3Client client() {
        return client;
    }

    /**
     * The unsigned URL of an object in the connection's region: the address a GET request for the object is sent to,
     * without a signature. Keys that start with or contain consecutive slashes keep them. The SDK's URL utility is not
     * used because it drops a key's leading slash, which addresses a different object.
     */
    public String unsignedUrl(String bucketName, String key) {
        String address = presignGetObject(settings.region(), bucketName, key, UNSIGNED_URL_SIGNATURE_DURATION);
        int query = address.indexOf('?');
        return query < 0 ? address : address.substring(0, query);
    }

    /**
     * URLs that let anyone GET each of the bucket's objects, signed for the bucket's region, which is resolved once for
     * all of them. Each URL is valid for the duration {@code validity} returns when that URL is signed.
     */
    public List<String> presignedGetUrls(String bucketName, List<String> keys, Supplier<Duration> validity) {
        Region region = signingRegion(bucketName);
        List<String> urls = new ArrayList<>(keys.size());
        for (String key : keys) {
            urls.add(presignGetObject(region, bucketName, key, validity.get()));
        }
        return urls;
    }

    private String presignGetObject(Region region, String bucketName, String key, Duration validFor) {
        return presigner(region)
                .presignGetObject(presign -> presign.signatureDuration(validFor)
                        .getObjectRequest(get -> get.bucket(bucketName).key(key)))
                .url()
                .toString();
    }

    /**
     * The presigner for the region. After {@link #close()} there is none: the call fails with an {@link
     * IllegalStateException}, as calls on the closed client do.
     */
    private S3Presigner presigner(Region region) {
        if (closed) {
            throw closedError();
        }
        S3Presigner presigner = presigners.computeIfAbsent(region, this::buildPresigner);
        if (closed) {
            // close() ran while the presigner was built and may not have closed it.
            presigners.remove(region, presigner);
            presigner.close();
            throw closedError();
        }
        return presigner;
    }

    private static IllegalStateException closedError() {
        return new IllegalStateException(CLOSED_MESSAGE);
    }

    private S3Presigner buildPresigner(Region region) {
        if (closed) {
            throw closedError();
        }
        S3Presigner.Builder builder = S3Presigner.builder()
                .region(region)
                .credentialsProvider(settings.credentialsProvider())
                .serviceConfiguration(serviceConfiguration(settings));
        if (settings.endpoint() != null) {
            builder.endpointOverride(settings.endpoint());
        }
        return builder.build();
    }

    /**
     * The connection's region, or for Amazon S3 the region of the bucket. A bucket's region is kept once it is found,
     * for up to {@link #MAX_KNOWN_BUCKET_REGIONS} buckets per connection; a bucket whose region cannot be determined
     * is signed for the connection's region and looked up again on the next call.
     */
    private Region signingRegion(String bucketName) {
        if (!settings.resolveBucketRegions()) {
            return settings.region();
        }
        Region known = bucketRegions.get(bucketName);
        if (known != null) {
            return known;
        }
        Optional<Region> found = lookUpBucketRegion(bucketName);
        if (found.isEmpty()) {
            log.warn(
                    "Could not determine the region of an S3 bucket; signing its URLs for {}.",
                    settings.region().id());
            return settings.region();
        }
        Region previous = bucketRegions.putIfAbsent(bucketName, found.get());
        return previous != null ? previous : found.get();
    }

    private Optional<Region> lookUpBucketRegion(String bucketName) {
        try {
            return regionOf(client.headBucket(head -> head.bucket(bucketName)).bucketRegion());
        } catch (AwsServiceException e) {
            // S3 names the bucket's region on error responses too, e.g. when the credentials may not list the bucket.
            // With cross-region access the SDK first retries such a response in the region it names, and a retry for
            // a name that is not a region name fails before it is sent; the check in regionOf is a backstop here.
            return Optional.ofNullable(e.awsErrorDetails())
                    .map(AwsErrorDetails::sdkHttpResponse)
                    .flatMap(response -> response.firstMatchingHeader(BUCKET_REGION_HEADER))
                    .flatMap(S3Connection::regionOf);
        } catch (SdkException e) {
            return Optional.empty();
        }
    }

    /** The region with the given id, when the id is a region name; anything else is ignored. */
    private static Optional<Region> regionOf(String regionId) {
        return DatasourceUtils.isRegionName(regionId) ? Optional.of(Region.of(regionId)) : Optional.empty();
    }

    @Override
    public void close() {
        closed = true;
        try {
            presigners.values().forEach(S3Presigner::close);
        } finally {
            client.close();
        }
    }
}
