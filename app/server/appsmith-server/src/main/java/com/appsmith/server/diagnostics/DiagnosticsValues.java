package com.appsmith.server.diagnostics;

import com.appsmith.external.enums.FeatureFlagEnum;
import org.springframework.data.mongodb.core.aggregation.AggregationOptions;

import java.time.Duration;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.function.Supplier;
import java.util.regex.Pattern;

/**
 * Fixed values a diagnostics section reports in place of data it cannot report. The redaction guard accepts the
 * sentinels listed in {@link #SENTINELS} under every key, whatever the kind of the key.
 */
public final class DiagnosticsValues {

    public static final String UNKNOWN = "UNKNOWN";
    public static final String NOT_SUPPORTED = "NOT_SUPPORTED";
    public static final String NOT_LICENSED = "NOT_LICENSED";
    public static final String NOT_APPLICABLE = "NOT_APPLICABLE";
    public static final String UNAVAILABLE = "UNAVAILABLE";
    public static final String OTHER = "other";
    public static final String UP = "UP";
    public static final String DOWN = "DOWN";

    /** Values the redaction guard accepts for any key. {@link #OTHER}, {@link #UP} and {@link #DOWN} are not among them. */
    public static final Set<String> SENTINELS =
            Set.of(UNKNOWN, NOT_SUPPORTED, NOT_LICENSED, NOT_APPLICABLE, UNAVAILABLE);

    /** A dotted numeric version with an optional {@code +} or {@code -} suffix, for example {@code 1.9.30-SNAPSHOT}. */
    public static final Pattern VERSION_PATTERN = Pattern.compile("^\\d+(\\.\\d+){0,3}([+-][A-Za-z0-9.]+)?$");

    /** A lowercase hex git commit SHA of 7 to 40 characters. */
    public static final Pattern COMMIT_SHA_PATTERN = Pattern.compile("^[0-9a-f]{7,40}$");

    /**
     * The options of every {@code *ForDiagnostics} aggregation. The 9-second {@code maxTimeMS} stops a slow aggregation
     * on the Mongo server before the 10-second section timeout cancels it on the client.
     */
    public static final AggregationOptions AGGREGATION_OPTIONS =
            AggregationOptions.builder().maxTime(Duration.ofSeconds(9)).build();

    /** The time limit of a collector's EE stage. It expires before the 10-second section timeout, so CE values survive. */
    public static final Duration EE_FIELDS_TIMEOUT = Duration.ofSeconds(8);

    /**
     * The time limit of one independent collector read, CE or EE. It stays below {@link #EE_FIELDS_TIMEOUT}, so a slow
     * read reports {@code UNKNOWN} for its own keys before the EE stage or the section times out.
     */
    public static final Duration EE_READ_TIMEOUT = Duration.ofSeconds(6);

    /** The time limit of a collector's flags read. A flag-gated read gets what is left of {@link #EE_READ_TIMEOUT}. */
    public static final Duration FLAGS_READ_TIMEOUT = Duration.ofSeconds(2);

    private DiagnosticsValues() {}

    /** @return a map that reports {@link #NOT_SUPPORTED} for each of {@code keys}, in iteration order. */
    public static Map<String, Object> allNotSupported(Collection<String> keys) {
        return allWith(keys, NOT_SUPPORTED);
    }

    /** @return a map that reports {@code value} for each of {@code keys}, in iteration order. */
    public static Map<String, Object> allWith(Collection<String> keys, Object value) {
        Map<String, Object> data = new LinkedHashMap<>();
        keys.forEach(key -> data.put(key, value));
        return data;
    }

    /**
     * Reads a license flag. {@code true} returns {@code whenLicensed.get()}, {@code false} returns
     * {@link #NOT_LICENSED}, and a missing flag returns {@link #UNKNOWN}.
     */
    public static Object fromFlag(Map<String, Boolean> flags, FeatureFlagEnum flag, Supplier<Object> whenLicensed) {
        Boolean enabled = flags == null ? null : flags.get(flag.name());
        if (enabled == null) {
            return UNKNOWN;
        }
        return enabled ? whenLicensed.get() : NOT_LICENSED;
    }

    /** @return {@code value}, or {@link #UNKNOWN} when it is null or does not match {@link #VERSION_PATTERN}. */
    public static String versionOrUnknown(String value) {
        return value != null && VERSION_PATTERN.matcher(value).matches() ? value : UNKNOWN;
    }

    /** @return {@code value}, or {@link #UNKNOWN} when it is null or does not match {@link #COMMIT_SHA_PATTERN}. */
    public static String commitShaOrUnknown(String value) {
        return value != null && COMMIT_SHA_PATTERN.matcher(value).matches() ? value : UNKNOWN;
    }
}
