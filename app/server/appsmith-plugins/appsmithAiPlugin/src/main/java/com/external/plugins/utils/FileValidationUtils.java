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
 * {@link CompositeDetector} returns the first non-{@code application/octet-stream} result, so magic wins
 * over the text fallback: an SVG uploaded as {@code report.txt} is still detected as {@code image/svg+xml}
 * and rejected.
 */
public class FileValidationUtils {

    private static final Detector DETECTOR = new CompositeDetector(MimeTypes.getDefaultMimeTypes(), new TextDetector());

    private FileValidationUtils() {}

    /**
     * Reads the file's bytes, detects its true content type, and rejects the upload if that type is not in
     * {@link com.external.plugins.constants.AppsmithAiConstants#SUPPORTED_FILE_MIME_TYPES}. On success the
     * bytes are returned as a replayable {@link BufferedFilePart} so the file can still be forwarded upstream.
     */
    public static Mono<FilePart> validateFileType(FilePart filePart) {
        return DataBufferUtils.join(filePart.content())
                .map(dataBuffer -> {
                    byte[] bytes = toByteArray(dataBuffer);
                    String detectedType = detect(bytes).getBaseType().toString();
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
                        String.format(FILE_TYPE_NOT_SUPPORTED, filePart.filename(), MediaType.OCTET_STREAM))));
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
