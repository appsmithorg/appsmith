package com.external.plugins.services;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
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
}
