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

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;

public class FileValidationUtilsTest {

    private static final byte[] SVG_BYTES = ("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
                    + "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"10\" height=\"10\">"
                    + "<script>alert(1)</script></svg>")
            .getBytes(StandardCharsets.UTF_8);

    private static final byte[] PDF_BYTES =
            ("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF")
                    .getBytes(StandardCharsets.UTF_8);

    private static final byte[] TEXT_BYTES =
            "Hello, this is a plain text file.\nWith a second line of content.".getBytes(StandardCharsets.UTF_8);

    private static final byte[] MARKDOWN_BYTES = ("# Release notes\n\n"
                    + "Some **bold** text, a [link](https://example.com) and a list:\n\n"
                    + "- first item\n- second item\n\nComparisons like 1 < 2 and a > b are fine.\n")
            .getBytes(StandardCharsets.UTF_8);

    // SVG that begins only after leading whitespace: Tika's magic detector misses it and the text fallback
    // reports text/plain, which is the bypass the anti-smuggling check must catch.
    private static final byte[] SVG_AFTER_WHITESPACE_BYTES =
            ("   \n\t<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>")
                    .getBytes(StandardCharsets.UTF_8);

    private static final byte[] SVG_AFTER_TEXT_BYTES =
            ("notes for later\n<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>")
                    .getBytes(StandardCharsets.UTF_8);

    private static final byte[] MARKDOWN_WITH_SCRIPT_BYTES =
            "# Title\n\nInline payload: <script>alert(document.cookie)</script>\n".getBytes(StandardCharsets.UTF_8);

    private static final byte[] TEXT_WITH_HTML_BYTES =
            "Please read below.\n<html><body>hi</body></html>\n".getBytes(StandardCharsets.UTF_8);

    private static final byte[] HTML_AFTER_WHITESPACE_BYTES =
            "  \n<!DOCTYPE html>\n<html><body>hi</body></html>".getBytes(StandardCharsets.UTF_8);

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

    @Test
    public void validateFileType_withRealSvg_isRejected() {
        FilePart svg = mockFilePart("image.svg", SVG_BYTES);
        StepVerifier.create(FileValidationUtils.validateFileType(svg))
                .expectError(AppsmithPluginException.class)
                .verify();
    }

    @Test
    public void validateFileType_withSvgSpoofedAsPdf_isRejected() {
        // Content is SVG but the filename claims PDF; content-based detection must see through it.
        FilePart spoofed = mockFilePart("totally-a.pdf", SVG_BYTES);
        StepVerifier.create(FileValidationUtils.validateFileType(spoofed))
                .expectError(AppsmithPluginException.class)
                .verify();
    }

    @Test
    public void validateFileType_withRealPdf_isAcceptedAndContentPreserved() {
        FilePart pdf = mockFilePart("doc.pdf", PDF_BYTES);
        StepVerifier.create(FileValidationUtils.validateFileType(pdf))
                .assertNext(validated -> {
                    assertThat(validated).isInstanceOf(BufferedFilePart.class);
                    assertThat(validated.filename()).isEqualTo("doc.pdf");
                    assertThat(readContent(validated)).isEqualTo(PDF_BYTES);
                })
                .verifyComplete();
    }

    @Test
    public void validateFileType_withPlainText_isAccepted() {
        FilePart text = mockFilePart("notes.txt", TEXT_BYTES);
        StepVerifier.create(FileValidationUtils.validateFileType(text))
                .assertNext(validated -> assertThat(validated).isInstanceOf(BufferedFilePart.class))
                .verifyComplete();
    }

    @Test
    public void validateFileType_withPlainTextSpoofedAsSvg_isAcceptedByContent() {
        // Content is harmless text even though the filename claims SVG; detection follows the bytes.
        FilePart text = mockFilePart("looks-like.svg", TEXT_BYTES);
        StepVerifier.create(FileValidationUtils.validateFileType(text))
                .assertNext(validated -> assertThat(validated).isInstanceOf(BufferedFilePart.class))
                .verifyComplete();
    }

    @Test
    public void validateFileType_withPlainMarkdown_isAccepted() {
        FilePart markdown = mockFilePart("notes.md", MARKDOWN_BYTES);
        StepVerifier.create(FileValidationUtils.validateFileType(markdown))
                .assertNext(validated -> assertThat(validated).isInstanceOf(BufferedFilePart.class))
                .verifyComplete();
    }

    @Test
    public void validateFileType_withSvgAfterLeadingWhitespace_isRejected() {
        FilePart svg = mockFilePart("payload.txt", SVG_AFTER_WHITESPACE_BYTES);
        StepVerifier.create(FileValidationUtils.validateFileType(svg))
                .expectError(AppsmithPluginException.class)
                .verify();
    }

    @Test
    public void validateFileType_withSvgAfterTextPrefix_isRejected() {
        FilePart svg = mockFilePart("payload.txt", SVG_AFTER_TEXT_BYTES);
        StepVerifier.create(FileValidationUtils.validateFileType(svg))
                .expectError(AppsmithPluginException.class)
                .verify();
    }

    @Test
    public void validateFileType_withMarkdownContainingScript_isRejected() {
        FilePart markdown = mockFilePart("notes.md", MARKDOWN_WITH_SCRIPT_BYTES);
        StepVerifier.create(FileValidationUtils.validateFileType(markdown))
                .expectError(AppsmithPluginException.class)
                .verify();
    }

    @Test
    public void validateFileType_withTextContainingHtml_isRejected() {
        FilePart text = mockFilePart("notes.txt", TEXT_WITH_HTML_BYTES);
        StepVerifier.create(FileValidationUtils.validateFileType(text))
                .expectError(AppsmithPluginException.class)
                .verify();
    }

    @Test
    public void validateFileType_withHtmlAfterLeadingWhitespace_isRejected() {
        FilePart html = mockFilePart("page.txt", HTML_AFTER_WHITESPACE_BYTES);
        StepVerifier.create(FileValidationUtils.validateFileType(html))
                .expectError(AppsmithPluginException.class)
                .verify();
    }
}
