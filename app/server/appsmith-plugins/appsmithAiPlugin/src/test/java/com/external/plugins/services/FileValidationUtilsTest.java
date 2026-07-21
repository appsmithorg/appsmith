package com.external.plugins.services;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.external.plugins.constants.AppsmithAiConstants;
import com.external.plugins.constants.AppsmithAiErrorMessages;
import com.external.plugins.utils.BufferedFilePart;
import com.external.plugins.utils.FileValidationUtils;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.codec.multipart.FilePart;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

import java.io.ByteArrayOutputStream;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;

public class FileValidationUtilsTest {

    // A bare SVG (no XML declaration) whose root sits at byte 0 - encoded into various charsets below.
    private static final String SVG =
            "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"10\" height=\"10\"><script>alert(1)</script></svg>";

    private static final byte[] SVG_UTF8 = SVG.getBytes(StandardCharsets.UTF_8);

    // Namespace-prefixed SVG root.
    private static final byte[] SVG_NAMESPACED =
            "<svg:svg xmlns:svg=\"http://www.w3.org/2000/svg\"><svg:rect/></svg:svg>".getBytes(StandardCharsets.UTF_8);

    // SVG that only begins after leading whitespace (a valid XML prolog) - Tika's ASCII magic misses it.
    private static final byte[] SVG_AFTER_WHITESPACE = ("   \n\t" + SVG).getBytes(StandardCharsets.UTF_8);

    // HTML behind leading whitespace.
    private static final byte[] HTML_AFTER_WHITESPACE =
            ("  \n<!DOCTYPE html>\n<html><body>hi</body></html>").getBytes(StandardCharsets.UTF_8);

    private static final byte[] PDF_BYTES =
            ("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF")
                    .getBytes(StandardCharsets.UTF_8);

    private static final byte[] TEXT_BYTES =
            "Hello, this is a plain text file.\nWith a second line and 1 < 2 > 0.".getBytes(StandardCharsets.UTF_8);

    private static final byte[] MARKDOWN_BYTES = ("# Release notes\n\n"
                    + "Some **bold** text, a [link](https://example.com) and a list:\n\n"
                    + "- first item\n- second item\n\nComparisons like 1 < 2 and a > b are fine.\n")
            .getBytes(StandardCharsets.UTF_8);

    private static byte[] withBom(byte[] body, int... bom) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        for (int b : bom) {
            out.write(b);
        }
        out.writeBytes(body);
        return out.toByteArray();
    }

    private static byte[] svgIn(Charset charset) {
        return SVG.getBytes(charset);
    }

    private static FilePart mockFilePart(String filename, byte[] content) {
        FilePart filePart = mock(FilePart.class);
        lenient().when(filePart.name()).thenReturn("files");
        lenient().when(filePart.filename()).thenReturn(filename);
        lenient().when(filePart.headers()).thenReturn(new HttpHeaders());
        // A fresh buffer per subscription mirrors a real single-use content stream.
        lenient()
                .when(filePart.content())
                .thenReturn(Flux.defer(() -> Flux.just(DefaultDataBufferFactory.sharedInstance.wrap(content))));
        return filePart;
    }

    private static byte[] readContent(FilePart filePart) {
        DataBuffer buffer = DataBufferUtils.join(filePart.content()).block();
        byte[] bytes = new byte[buffer.readableByteCount()];
        buffer.read(bytes);
        return bytes;
    }

    private static void expectRejected(byte[] content, String filename) {
        StepVerifier.create(FileValidationUtils.validateFileType(mockFilePart(filename, content)))
                .expectError(AppsmithPluginException.class)
                .verify();
    }

    private static void expectAccepted(byte[] content, String filename) {
        StepVerifier.create(FileValidationUtils.validateFileType(mockFilePart(filename, content)))
                .assertNext(validated -> assertThat(validated).isInstanceOf(BufferedFilePart.class))
                .verifyComplete();
    }

    // Asserts the file was rejected specifically by the size cap: the exact FILE_TOO_LARGE message, which the
    // type-rejection path (FILE_TYPE_NOT_SUPPORTED) would not produce.
    private static void expectSizeRejected(FilePart filePart) {
        String expectedMessage = String.format(
                AppsmithAiErrorMessages.FILE_TOO_LARGE,
                filePart.filename(),
                AppsmithAiConstants.MAX_UPLOAD_FILE_SIZE_IN_BYTES / (1024 * 1024));
        StepVerifier.create(FileValidationUtils.validateFileType(filePart))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(AppsmithPluginException.class);
                    assertThat(error.getMessage()).isEqualTo(expectedMessage);
                })
                .verify();
    }

    // Asserts the file was rejected by content-type detection: the exact FILE_TYPE_NOT_SUPPORTED message with
    // the given detected type - i.e. by the allow-list.
    private static void expectTypeRejected(byte[] content, String filename, String detectedType) {
        String expectedMessage = String.format(AppsmithAiErrorMessages.FILE_TYPE_NOT_SUPPORTED, filename, detectedType);
        StepVerifier.create(FileValidationUtils.validateFileType(mockFilePart(filename, content)))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(AppsmithPluginException.class);
                    assertThat(error.getMessage()).isEqualTo(expectedMessage);
                })
                .verify();
    }

    // Bytes larger than FileValidationUtils' 64 KiB detection head, so markup after the padding sits past it.
    private static final int OVER_HEAD_PAD = 70 * 1024;

    private static byte[] concat(byte[] a, byte[] b) {
        byte[] out = new byte[a.length + b.length];
        System.arraycopy(a, 0, out, 0, a.length);
        System.arraycopy(b, 0, out, a.length, b.length);
        return out;
    }

    private static byte[] padThen(int padSize, byte pad, String tail) {
        byte[] tailBytes = tail.getBytes(StandardCharsets.UTF_8);
        byte[] out = new byte[padSize + tailBytes.length];
        Arrays.fill(out, 0, padSize, pad);
        System.arraycopy(tailBytes, 0, out, padSize, tailBytes.length);
        return out;
    }

    // --- SVG rejected across encodings and prologs (the core of the finding) ---

    @Test
    public void validateFileType_withUtf8Svg_isRejected() {
        expectRejected(SVG_UTF8, "image.svg");
    }

    @Test
    public void validateFileType_withNamespacedSvg_isRejected() {
        expectRejected(SVG_NAMESPACED, "image.svg");
    }

    @Test
    public void validateFileType_withUtf16LeSvgWithBom_isRejected() {
        expectRejected(withBom(svgIn(StandardCharsets.UTF_16LE), 0xFF, 0xFE), "image.svg");
    }

    @Test
    public void validateFileType_withUtf16BeSvgWithBom_isRejected() {
        expectRejected(withBom(svgIn(StandardCharsets.UTF_16BE), 0xFE, 0xFF), "image.svg");
    }

    @Test
    public void validateFileType_withUtf16LeSvgWithoutBom_isRejected() {
        expectRejected(svgIn(StandardCharsets.UTF_16LE), "image.svg");
    }

    @Test
    public void validateFileType_withUtf16BeSvgWithoutBom_isRejected() {
        expectRejected(svgIn(StandardCharsets.UTF_16BE), "image.svg");
    }

    @Test
    public void validateFileType_withUtf32BeSvg_isRejected() {
        expectRejected(svgIn(Charset.forName("UTF-32BE")), "image.svg");
    }

    @Test
    public void validateFileType_withUtf32LeSvg_isRejected() {
        expectRejected(svgIn(Charset.forName("UTF-32LE")), "image.svg");
    }

    @Test
    public void validateFileType_withSvgAfterLeadingWhitespace_isRejected() {
        expectRejected(SVG_AFTER_WHITESPACE, "payload.txt");
    }

    @Test
    public void validateFileType_withHtmlAfterLeadingWhitespace_isRejected() {
        expectRejected(HTML_AFTER_WHITESPACE, "page.txt");
    }

    @Test
    public void validateFileType_withSvgSpoofedAsPdf_isRejected() {
        // Content is SVG but the filename claims PDF; content-based detection must see through it.
        expectRejected(SVG_UTF8, "totally-a.pdf");
    }

    // --- Allowed types still pass, regardless of filename ---

    @Test
    public void validateFileType_withRealPdf_isAcceptedAndContentPreserved() {
        StepVerifier.create(FileValidationUtils.validateFileType(mockFilePart("doc.pdf", PDF_BYTES)))
                .assertNext(validated -> {
                    assertThat(validated).isInstanceOf(BufferedFilePart.class);
                    assertThat(validated.filename()).isEqualTo("doc.pdf");
                    // The buffered part replays the original bytes for forwarding, and can be read twice.
                    assertThat(readContent(validated)).isEqualTo(PDF_BYTES);
                    assertThat(readContent(validated)).isEqualTo(PDF_BYTES);
                })
                .verifyComplete();
    }

    @Test
    public void validateFileType_withPlainText_isAccepted() {
        expectAccepted(TEXT_BYTES, "notes.txt");
    }

    @Test
    public void validateFileType_withPlainMarkdown_isAccepted() {
        expectAccepted(MARKDOWN_BYTES, "notes.md");
    }

    @Test
    public void validateFileType_withPlainTextSpoofedAsSvg_isAcceptedByContent() {
        // Harmless text even though the filename claims SVG; detection follows the bytes.
        expectAccepted(TEXT_BYTES, "looks-like.svg");
    }

    @Test
    public void validateFileType_withWideEncodedPlainText_isAccepted() {
        // A genuine UTF-16LE text file is normalized and accepted as text/plain, not rejected as binary.
        expectAccepted("Just an ordinary note in a wide encoding.".getBytes(StandardCharsets.UTF_16LE), "notes.txt");
    }

    // --- Per-file size cap (uses 'a'-filled content, which is valid text/plain, so only the size cap - not
    // type detection - can reject it; and asserts the specific FILE_TOO_LARGE error) ---

    @Test
    public void validateFileType_atExactlySizeCap_isAccepted() {
        // Boundary: a file of exactly the cap must pass (guards against a >= off-by-one).
        byte[] atLimit = new byte[AppsmithAiConstants.MAX_UPLOAD_FILE_SIZE_IN_BYTES];
        Arrays.fill(atLimit, (byte) 'a');
        expectAccepted(atLimit, "at-limit.txt");
    }

    @Test
    public void validateFileType_oneByteOverSizeCap_isRejectedWithSizeError() {
        // Boundary: one byte over the cap must be rejected, and specifically by the size cap. 'a'-filled
        // content is valid text/plain, so if the cap were removed (join without maxByteCount) this would be
        // accepted - the test can only pass because of the cap.
        byte[] overLimit = new byte[AppsmithAiConstants.MAX_UPLOAD_FILE_SIZE_IN_BYTES + 1];
        Arrays.fill(overLimit, (byte) 'a');
        expectSizeRejected(mockFilePart("huge.txt", overLimit));
    }

    @Test
    public void validateFileType_withChunkedStreamExceedingCap_failsFastWithoutBufferingAll() {
        // The cap must trip mid-stream, not only on a single pre-buffered array: feed the content as many
        // 1 MiB chunks and assert join stops near the cap rather than draining the whole (3x cap) source.
        int chunkSize = 1024 * 1024;
        int capChunks = AppsmithAiConstants.MAX_UPLOAD_FILE_SIZE_IN_BYTES / chunkSize;
        int sourceChunks = capChunks * 3;
        byte[] chunk = new byte[chunkSize];
        Arrays.fill(chunk, (byte) 'a');
        AtomicInteger emittedChunks = new AtomicInteger();

        FilePart filePart = mock(FilePart.class);
        lenient().when(filePart.name()).thenReturn("files");
        lenient().when(filePart.filename()).thenReturn("chunked.txt");
        lenient().when(filePart.headers()).thenReturn(new HttpHeaders());
        lenient()
                .when(filePart.content())
                .thenReturn(Flux.range(0, sourceChunks).map(i -> {
                    emittedChunks.incrementAndGet();
                    return DefaultDataBufferFactory.sharedInstance.wrap(chunk);
                }));

        expectSizeRejected(filePart);

        // Fail-fast: the source could emit 3x the cap, but join must have cancelled it shortly after the cap
        // was exceeded rather than pulling the entire oversized payload into memory.
        assertThat(emittedChunks.get()).isLessThanOrEqualTo(capChunks + 2);
    }

    // --- Content-type-only validation. Wide-encoded SVG is resolved to a disallowed type by the
    // encoding-aware detection and rejected. The accepted low-severity residual - text that Tika types as an
    // allowed type but embeds markup - is pinned by the accept tests below; uploaded files are S3-stored, not
    // served as HTML from the app origin, so embedded markup cannot execute as stored XSS. ---

    @Test
    public void validateFileType_withWideEncodedWhitespacePaddedSvg_isRejectedByTypeDetection() {
        // A UTF-16LE SVG padded past the head: encoding-aware detection resolves the all-whitespace head to
        // application/octet-stream, which the allow-list rejects. Assert that exact path.
        String doc = " ".repeat(OVER_HEAD_PAD) + "<svg xmlns=\"http://www.w3.org/2000/svg\"/>";
        expectTypeRejected(doc.getBytes(StandardCharsets.UTF_16LE), "padded-wide.svg", "application/octet-stream");
    }

    @Test
    public void validateFileType_withWideEncodedSvgNearStart_isRejectedByTypeDetection() {
        // A UTF-16LE SVG whose root is near the start is resolved to image/svg+xml by the encoding-aware
        // detection and rejected.
        String doc = "  <svg xmlns=\"http://www.w3.org/2000/svg\"/>";
        expectTypeRejected(doc.getBytes(StandardCharsets.UTF_16LE), "wide.svg", "image/svg+xml");
    }

    @Test
    public void validateFileType_withNonWhitespacePaddedMarkup_isAccepted() {
        // Accepted residual: markup padded past the detection window with non-whitespace bytes types as text
        // and is accepted (S3-stored, not app-origin served, so it cannot execute as stored XSS).
        byte[] content = padThen(OVER_HEAD_PAD, (byte) 'a', "<script>alert(document.cookie)</script>");
        expectAccepted(content, "padded.txt");
    }

    @Test
    public void validateFileType_withProseMentioningMarkup_isAccepted() {
        // Accepted residual: prose that merely mentions a tag types as text and is accepted.
        byte[] content =
                "documentation text mentioning <script tags, not an HTML document.".getBytes(StandardCharsets.UTF_8);
        expectAccepted(content, "notes.txt");
    }

    @Test
    public void validateFileType_withMarkdownEmbeddingMarkupExamples_isAccepted() {
        // Accepted residual: markdown that embeds markup in prose and a fenced code block types as text.
        String snippet = "# HTML notes\n\nUse `<script>` for JS and an inline <div> for layout. Example:\n\n"
                + "```\n<svg><rect/></svg>\n```\n\nAlso 1 < 2 holds.\n\n";
        byte[] content = snippet.repeat(1000).getBytes(StandardCharsets.UTF_8);
        expectAccepted(content, "big.md");
    }

    @Test
    public void validateFileType_withLargeUniformPlainText_isAccepted() {
        byte[] content = new byte[OVER_HEAD_PAD + 4096];
        Arrays.fill(content, (byte) 'a');
        expectAccepted(content, "big.txt");
    }

    @Test
    public void validateFileType_withLargeMarkdown_isAccepted() {
        // >64 KiB of ordinary markdown (angle brackets only as "1 < 2", never a markup root) must pass.
        String snippet = "# Heading\n\nParagraph with a [link](https://example.com) and 1 < 2 comparisons.\n\n";
        byte[] content = snippet.repeat(1200).getBytes(StandardCharsets.UTF_8);
        expectAccepted(content, "big.md");
    }

    @Test
    public void validateFileType_withLargePdf_isAccepted() {
        // A >64 KiB PDF (magic at offset 0) is detected as application/pdf and never markup-checked.
        byte[] filler = new byte[OVER_HEAD_PAD];
        Arrays.fill(filler, (byte) 'a');
        byte[] content = concat(
                "%PDF-1.4\n".getBytes(StandardCharsets.UTF_8),
                concat(filler, "\n%%EOF".getBytes(StandardCharsets.UTF_8)));
        expectAccepted(content, "big.pdf");
    }

    @Test
    public void validateFileType_withPdfEmbeddingMarkup_isAccepted() {
        // A real PDF may legitimately embed markup; the guard must not check PDFs, so this is accepted.
        byte[] content =
                "%PDF-1.4\n<svg><script>x</script></svg>\nstream ... endstream\n%%EOF".getBytes(StandardCharsets.UTF_8);
        expectAccepted(content, "with-markup.pdf");
    }
}
