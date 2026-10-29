package com.external.plugins;

import com.fasterxml.jackson.core.util.DefaultIndenter;
import com.fasterxml.jackson.core.util.DefaultPrettyPrinter;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;

import static org.assertj.core.api.Assertions.assertThat;

/** Prints JSON in one canonical layout so expected files compare by key order, values and value types only. */
final class JsonFixtures {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final DefaultPrettyPrinter PRETTY_PRINTER =
            new DefaultPrettyPrinter().withObjectIndenter(new DefaultIndenter("  ", "\n"));

    private JsonFixtures() {}

    static String prettyPrint(Object body) {
        try {
            return MAPPER.writer(PRETTY_PRINTER).writeValueAsString(body);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /**
     * Re-prints a JSON resource with the same printer as {@link #prettyPrint}, so the comparison ignores whitespace
     * (Spotless formats JSON resources) but still checks key order, values and value types exactly.
     */
    static String expectedJson(String resourcePath) {
        try (InputStream stream = JsonFixtures.class.getResourceAsStream(resourcePath)) {
            assertThat(stream).as("resource %s", resourcePath).isNotNull();
            return prettyPrint(MAPPER.readTree(stream));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    static byte[] resourceBytes(String resourcePath) {
        try (InputStream stream = JsonFixtures.class.getResourceAsStream(resourcePath)) {
            assertThat(stream).as("resource %s", resourcePath).isNotNull();
            return stream.readAllBytes();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
