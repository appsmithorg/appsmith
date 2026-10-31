package com.appsmith.server.dtos;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PageUpdateDTOTest {
    @Test
    void should_preserveExistingPageFields_when_requestUsesEditionBase() throws Exception {
        // Given
        PageUpdateDTO request = new ObjectMapper()
                .readValue(
                        "{\"name\":\" Page 2 \",\"icon\":\" book-line \",\"customSlug\":\"page-two\",\"isHidden\":true}",
                        PageUpdateDTO.class);

        // When
        PageDTO page = request.toPageDTO();

        // Then
        assertThat(page.getName()).isEqualTo("Page 2");
        assertThat(page.getIcon()).isEqualTo("book-line");
        assertThat(page.getCustomSlug()).isEqualTo("page-two");
        assertThat(page.getIsHidden()).isTrue();
    }

    @Test
    void should_retainRequestValidation_when_constraintsMoveToBase() throws Exception {
        // Given
        PageUpdateDTO request = new ObjectMapper()
                .readValue(
                        "{\"name\":\"a-name-that-exceeds-the-thirty-character-limit\",\"customSlug\":\"invalid/slug\"}",
                        PageUpdateDTO.class);

        // When
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var violations = factory.getValidator().validate(request);

            // Then
            assertThat(violations)
                    .extracting(v -> v.getPropertyPath().toString())
                    .contains("name", "customSlug");
        }
    }
}
