package com.appsmith.server.domains;

import com.appsmith.external.views.Git;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

class ApplicationDescriptionTest {

    @ParameterizedTest
    @CsvSource({
        "'  Locker system  ', 'Locker system'",
        "'Plain text', 'Plain text'",
    })
    void should_trimDescription_when_set(String input, String expected) {
        // Given
        Application application = new Application();

        // When
        application.setDescription(input);

        // Then
        assertThat(application.getDescription()).isEqualTo(expected);
    }

    @Test
    void should_keepDescriptionNull_when_setToNull() {
        // Given
        Application application = new Application();

        // When
        application.setDescription(null);

        // Then
        assertThat(application.getDescription()).isNull();
    }

    @ParameterizedTest
    @CsvSource({"''", "'   '"})
    void should_storeEmptyString_when_setToBlank(String input) {
        // Given
        Application application = new Application();

        // When
        application.setDescription(input);

        // Then
        // Empty string is the explicit "clear" signal for the sparse update;
        // null would leave the persisted value untouched.
        assertThat(application.getDescription()).isEqualTo("");
    }

    @Test
    void should_includeDescription_when_serializedWithPublicOrGitView() throws Exception {
        // Given
        Application application = new Application();
        application.setDescription("Seagate Locker system");
        // Without DEFAULT_VIEW_INCLUSION an un-annotated field is excluded from every view,
        // so this only passes when the field carries the Public and Git views.
        ObjectMapper objectMapper = new ObjectMapper().disable(MapperFeature.DEFAULT_VIEW_INCLUSION);

        // When
        String gitJson = objectMapper.writerWithView(Git.class).writeValueAsString(application);
        String publicJson = objectMapper.writerWithView(Views.Public.class).writeValueAsString(application);

        // Then
        assertThat(gitJson).contains("\"description\":\"Seagate Locker system\"");
        assertThat(publicJson).contains("\"description\":\"Seagate Locker system\"");
    }

    @Test
    void should_truncateToMaxLength_when_clampedWithLongerValue() {
        // Given
        Application application = new Application();
        application.setDescription("  " + "x".repeat(Application.DESCRIPTION_MAX_LENGTH + 30) + "  ");

        // When
        application.clampDescriptionToMaxLength();

        // Then
        assertThat(application.getDescription()).isEqualTo("x".repeat(Application.DESCRIPTION_MAX_LENGTH));
    }

    @Test
    void should_dropWholeSurrogatePair_when_clampCutsThroughIt() {
        // Given
        // A lone high surrogate at the cut point is invalid UTF-16 and can fail a UTF-8 encode downstream.
        String emoji = "😀";
        Application application = new Application();
        application.setDescription("a".repeat(Application.DESCRIPTION_MAX_LENGTH - 1) + emoji);

        // When
        application.clampDescriptionToMaxLength();

        // Then
        assertThat(application.getDescription()).isEqualTo("a".repeat(Application.DESCRIPTION_MAX_LENGTH - 1));
    }

    @Test
    void should_leaveValueUntouched_when_clampedWithinMaxLength() {
        // Given
        String emoji = "😀";
        String exactlyMax = "a".repeat(Application.DESCRIPTION_MAX_LENGTH - 2) + emoji;
        Application application = new Application();
        application.setDescription(exactlyMax);

        // When
        application.clampDescriptionToMaxLength();

        // Then
        assertThat(application.getDescription()).isEqualTo(exactlyMax);
    }

    @Test
    void should_keepNull_when_clampedWithoutDescription() {
        // Given
        Application application = new Application();

        // When
        application.clampDescriptionToMaxLength();

        // Then
        assertThat(application.getDescription()).isNull();
    }

    @Test
    void should_copyDescription_when_clonedThroughCopyConstructor() {
        // Given
        Application source = new Application();
        source.setDescription("Copied over");

        // When
        Application clone = new Application(source);

        // Then
        assertThat(clone.getDescription()).isEqualTo("Copied over");
    }
}
