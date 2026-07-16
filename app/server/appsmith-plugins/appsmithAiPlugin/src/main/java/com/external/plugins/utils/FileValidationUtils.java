package com.external.plugins.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import org.apache.tika.detect.CompositeDetector;
import org.apache.tika.detect.Detector;
import org.apache.tika.detect.TextDetector;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.mime.MediaType;
import org.apache.tika.mime.MimeTypes;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.codec.multipart.FilePart;
import reactor.core.publisher.Mono;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;

import static com.external.plugins.constants.AppsmithAiConstants.SUPPORTED_FILE_MIME_TYPES;
import static com.external.plugins.constants.AppsmithAiErrorMessages.FILE_TYPE_NOT_SUPPORTED;

/**
 * Validates uploaded files by their true content type rather than the client-supplied filename or
 * Content-Type header, both of which are trivially spoofable.
 *
 * <p>Detection is content-only and does not rely on Tika's {@code ServiceLoader}-based detector discovery
 * (which is fragile once the plugin is shaded into an uber-jar). We compose two detectors that tika-core
 * ships and instantiate directly:
 * <ul>
 *   <li>{@link MimeTypes} - magic-byte / mime detection from the bundled {@code tika-mimetypes.xml}. This
 *       catches structured types such as SVG, HTML and PDF regardless of the file's extension.</li>
 *   <li>{@link TextDetector} - a statistical fallback that classifies magic-less content as
 *       {@code text/plain} (plain text and markdown carry no magic signature).</li>
 * </ul>
 *
 * <p>The bundled magic only recognises XML/SVG roots as ASCII bytes at offset 0, so an SVG encoded as
 * UTF-16/UTF-32 or hidden behind a byte-order mark or leading whitespace would otherwise fall through to the
 * allow-listed {@code text/plain}. To close that gap at the detection layer (rather than scanning bytes),
 * when the first pass is ambiguous ({@code text/plain}/{@code application/octet-stream}) the head is decoded
 * from its real charset, its BOM and prolog whitespace trimmed, re-encoded as UTF-8 and re-detected. This
 * surfaces the true type - e.g. {@code image/svg+xml} - which is then rejected by the allow-list. Verified
 * against UTF-8/UTF-16LE/UTF-16BE/UTF-32 and namespace-prefixed SVG.
 */
public class FileValidationUtils {

    private static final Detector DETECTOR = new CompositeDetector(MimeTypes.getDefaultMimeTypes(), new TextDetector());

    // Types that carry no distinguishing magic and so cannot be trusted as "final" on their own: an encoded
    // or prolog-padded XML/SVG document lands here on the first pass and warrants a normalized re-detection.
    private static final MediaType TEXT_PLAIN = MediaType.TEXT_PLAIN;
    private static final MediaType OCTET_STREAM = MediaType.OCTET_STREAM;

    // Only the head is decoded for the normalized re-detection; a document's XML/SVG root sits near the start,
    // and the full (already size-bounded) file is never decoded into a String.
    private static final int HEAD_DECODE_LIMIT = 64 * 1024;

    private FileValidationUtils() {}

    /**
     * Reads the file's bytes, detects its true content type, and rejects the upload if that type is not in
     * {@link com.external.plugins.constants.AppsmithAiConstants#SUPPORTED_FILE_MIME_TYPES}. On success the
     * bytes are returned as a replayable {@link BufferedFilePart} so the file can still be forwarded upstream.
     */
    public static Mono<FilePart> validateFileType(FilePart filePart) {
        // The joined content is held in memory only up to the multipart body limit configured for the
        // deployment (spring.webflux.multipart.max-in-memory-size / Caddy body cap, 150MB by default in
        // application-ce.properties), which is the size control for this buffering; no bespoke cap here.
        return DataBufferUtils.join(filePart.content())
                .map(dataBuffer -> {
                    byte[] bytes = toByteArray(dataBuffer);
                    String detectedType = detectTrueType(bytes).getBaseType().toString();
                    if (!SUPPORTED_FILE_MIME_TYPES.contains(detectedType)) {
                        throw new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                String.format(FILE_TYPE_NOT_SUPPORTED, filePart.filename(), detectedType));
                    }
                    return (FilePart) new BufferedFilePart(filePart, bytes);
                })
                // An empty content stream yields no buffer to inspect; treat it as an undetectable file.
                .switchIfEmpty(Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        String.format(FILE_TYPE_NOT_SUPPORTED, filePart.filename(), OCTET_STREAM))));
    }

    /**
     * Detects the true content type of the raw bytes. A structured first-pass result (e.g. PDF, or an SVG in
     * ASCII/UTF-8) is authoritative. When the first pass is ambiguous, the head is normalized to UTF-8 (its
     * real charset decoded, BOM and prolog whitespace stripped) and re-detected so an encoded or padded
     * XML/SVG document surfaces its true type. Genuine plain text stays {@code text/plain}; opaque binary
     * stays {@code application/octet-stream}.
     */
    private static MediaType detectTrueType(byte[] content) {
        MediaType detected = detect(content);
        if (!isAmbiguous(detected)) {
            return detected;
        }
        Charset wideCharset = detectWideCharset(content);
        MediaType normalized = detect(normalizeHeadToUtf8(content, wideCharset));
        if (!isAmbiguous(normalized)) {
            // Normalization revealed a concrete type (e.g. image/svg+xml, text/html) hidden by the encoding.
            return normalized;
        }
        if (wideCharset != null) {
            // A genuinely wide-encoded text file: trust the normalized text/plain rather than the raw
            // octet-stream the null bytes produced.
            return normalized;
        }
        // Opaque binary with no recognizable text: keep the first-pass result so it stays rejected.
        return detected;
    }

    private static boolean isAmbiguous(MediaType type) {
        MediaType base = type.getBaseType();
        return base.equals(TEXT_PLAIN) || base.equals(OCTET_STREAM);
    }

    /**
     * Detects a UTF-16/UTF-32 encoding from a leading byte-order mark, or, failing that, from the regular
     * null-byte pattern that ASCII text produces in those encodings. Returns {@code null} for single-byte /
     * UTF-8 content (which needs no re-encoding).
     */
    private static Charset detectWideCharset(byte[] b) {
        int n = b.length;
        if (n >= 4 && u(b[0]) == 0x00 && u(b[1]) == 0x00 && u(b[2]) == 0xFE && u(b[3]) == 0xFF) {
            return Charset.forName("UTF-32BE");
        }
        if (n >= 4 && u(b[0]) == 0xFF && u(b[1]) == 0xFE && u(b[2]) == 0x00 && u(b[3]) == 0x00) {
            return Charset.forName("UTF-32LE");
        }
        if (n >= 2 && u(b[0]) == 0xFE && u(b[1]) == 0xFF) {
            return StandardCharsets.UTF_16BE;
        }
        if (n >= 2 && u(b[0]) == 0xFF && u(b[1]) == 0xFE) {
            return StandardCharsets.UTF_16LE;
        }
        // BOM-less heuristic over the head: ASCII characters in wide encodings leave nulls at fixed offsets.
        int window = Math.min(n, 64);
        if (window < 4) {
            return null;
        }
        int z0 = 0, z1 = 0, z2 = 0, z3 = 0, quads = 0;
        for (int i = 0; i + 3 < window; i += 4) {
            if (b[i] == 0) z0++;
            if (b[i + 1] == 0) z1++;
            if (b[i + 2] == 0) z2++;
            if (b[i + 3] == 0) z3++;
            quads++;
        }
        if (quads > 0) {
            if (z0 == quads && z1 == quads && z2 == quads && z3 == 0) {
                return Charset.forName("UTF-32BE");
            }
            if (z0 == 0 && z1 == quads && z2 == quads && z3 == quads) {
                return Charset.forName("UTF-32LE");
            }
        }
        int evenZero = 0, oddZero = 0, pairs = 0;
        for (int i = 0; i + 1 < window; i += 2) {
            if (b[i] == 0) evenZero++;
            if (b[i + 1] == 0) oddZero++;
            pairs++;
        }
        if (pairs > 0) {
            if (evenZero == pairs && oddZero == 0) {
                return StandardCharsets.UTF_16BE;
            }
            if (oddZero == pairs && evenZero == 0) {
                return StandardCharsets.UTF_16LE;
            }
        }
        return null;
    }

    /**
     * Decodes the head with the given charset (UTF-8 when {@code null}), strips a leading BOM and XML-prolog
     * whitespace, and re-encodes as UTF-8 so an XML/SVG root that was encoded or offset lands at byte 0 where
     * the magic can match it.
     */
    private static byte[] normalizeHeadToUtf8(byte[] content, Charset wideCharset) {
        Charset charset = wideCharset != null ? wideCharset : StandardCharsets.UTF_8;
        int limit = Math.min(content.length, HEAD_DECODE_LIMIT);
        String decoded = new String(content, 0, limit, charset);
        int start = 0;
        if (!decoded.isEmpty() && decoded.charAt(0) == '\uFEFF') {
            start = 1;
        }
        while (start < decoded.length() && Character.isWhitespace(decoded.charAt(start))) {
            start++;
        }
        return decoded.substring(start).getBytes(StandardCharsets.UTF_8);
    }

    private static int u(byte b) {
        return b & 0xFF;
    }

    private static byte[] toByteArray(DataBuffer dataBuffer) {
        try {
            byte[] bytes = new byte[dataBuffer.readableByteCount()];
            dataBuffer.read(bytes);
            return bytes;
        } finally {
            DataBufferUtils.release(dataBuffer);
        }
    }

    /**
     * Detects the content type from the raw bytes only. On an I/O failure we fail closed by returning
     * {@code application/octet-stream}, which is not in the allow-list and therefore rejects the file.
     */
    private static MediaType detect(byte[] content) {
        try (InputStream stream = new ByteArrayInputStream(content)) {
            return DETECTOR.detect(stream, new Metadata());
        } catch (IOException e) {
            return MediaType.OCTET_STREAM;
        }
    }
}
