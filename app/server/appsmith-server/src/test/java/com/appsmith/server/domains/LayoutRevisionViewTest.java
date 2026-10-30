package com.appsmith.server.domains;

import com.appsmith.external.views.Git;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The layout revision goes to API clients only. Exports and Git files must not carry it.
 */
class LayoutRevisionViewTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @ParameterizedTest
    @ValueSource(classes = {Views.Export.class, Git.class})
    void should_omitRevision_when_layoutIsExportedOrWrittenToGit(Class<?> view) throws Exception {
        // Given
        Layout layout = new Layout();
        layout.setId("layout");
        layout.setRevision("1700000000000");

        // When
        String json = objectMapper.writerWithView(view).writeValueAsString(layout);

        // Then
        assertThat(json).doesNotContain("revision").doesNotContain("1700000000000");
    }

    @Test
    void should_includeRevision_when_layoutIsReturnedToClient() throws Exception {
        // Given
        Layout layout = new Layout();
        layout.setRevision("1700000000000");

        // When
        String json = objectMapper.writerWithView(Views.Public.class).writeValueAsString(layout);

        // Then
        assertThat(json).contains("\"revision\":\"1700000000000\"");
    }
}
