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
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;

import static com.external.plugins.constants.AppsmithAiConstants.SUPPORTED_FILE_MIME_TYPES;
import static com.external.plugins.constants.AppsmithAiErrorMessages.FILE_CONTAINS_ACTIVE_MARKUP;
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
 * {@link CompositeDetector} returns the first non-{@code application/octet-stream} result, so magic wins
 * over the text fallback: an SVG uploaded as {@code report.txt} is still detected as {@code image/svg+xml}
 * and rejected.
 *
 * <p>The text fallback is not a security boundary on its own: Tika reports SVG/HTML as {@code text/plain}
 * when the markup does not sit at byte 0 (e.g. after leading whitespace or a short text prefix). Because
 * {@code text/plain} is allow-listed, a file accepted as text is additionally screened for smuggled markup
 * roots (see {@link #containsSmuggledMarkup}) so such payloads cannot slip through the text path.
 */
public class FileValidationUtils {

    private static final Detector DETECTOR = new CompositeDetector(MimeTypes.getDefaultMimeTypes(), new TextDetector());

    // Markup roots that must never appear in a file we accept as text. These are the signatures a downstream
    // renderer would act on if it treated the "text" file as SVG/HTML/XML. This is a narrow anti-smuggling
    // check for the text/* path only - deliberately NOT a general markup/polyglot scanner.
    private static final List<String> MARKUP_ROOT_MARKERS =
            List.of("<svg", "<?xml", "<html", "<!doctype html", "<!doctype svg", "<script");

    // A smuggled markup root has to sit near the start for a renderer to treat the file as markup, so only the
    // leading window is scanned rather than the whole (already size-bounded) file.
    private static final int MARKUP_SCAN_LIMIT = 8192;

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
                    String detectedType = detect(bytes).getBaseType().toString();
                    if (!SUPPORTED_FILE_MIME_TYPES.contains(detectedType)) {
                        throw new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                String.format(FILE_TYPE_NOT_SUPPORTED, filePart.filename(), detectedType));
                    }
                    // Tika's text fallback reports SVG/HTML as text/plain when the markup does not start at
                    // byte 0; reject any file accepted as text that smuggles a markup root.
                    if (detectedType.startsWith("text/") && containsSmuggledMarkup(bytes)) {
                        throw new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                String.format(FILE_CONTAINS_ACTIVE_MARKUP, filePart.filename()));
                    }
                    return (FilePart) new BufferedFilePart(filePart, bytes);
                })
                // An empty content stream yields no buffer to inspect; treat it as an undetectable file.
                .switchIfEmpty(Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        String.format(FILE_TYPE_NOT_SUPPORTED, filePart.filename(), MediaType.OCTET_STREAM))));
    }

    /**
     * Scans the leading window of a text file (after any BOM and leading whitespace) for an XML/HTML/SVG/
     * script root marker, case-insensitively. Catches markup that Tika reported as {@code text/plain} because
     * it did not begin at byte 0 (leading whitespace or a short text prefix).
     */
    private static boolean containsSmuggledMarkup(byte[] content) {
        int start = skipBomAndWhitespace(content);
        int end = Math.min(content.length, start + MARKUP_SCAN_LIMIT);
        if (start >= end) {
            return false;
        }
        // ISO-8859-1 maps every byte to a char, so the ASCII markers survive regardless of the real encoding.
        String head = new String(content, start, end - start, StandardCharsets.ISO_8859_1).toLowerCase(Locale.ROOT);
        for (String marker : MARKUP_ROOT_MARKERS) {
            if (head.contains(marker)) {
                return true;
            }
        }
        return false;
    }

    private static int skipBomAndWhitespace(byte[] content) {
        int i = 0;
        // Skip a UTF-8 byte-order mark if present.
        if (content.length >= 3
                && (content[0] & 0xFF) == 0xEF
                && (content[1] & 0xFF) == 0xBB
                && (content[2] & 0xFF) == 0xBF) {
            i = 3;
        }
        while (i < content.length && Character.isWhitespace(content[i] & 0xFF)) {
            i++;
        }
        return i;
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
