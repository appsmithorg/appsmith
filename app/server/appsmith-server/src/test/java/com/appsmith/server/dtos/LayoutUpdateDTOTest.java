package com.appsmith.server.dtos;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LayoutUpdateDTOTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void should_readExpectedRevision_when_requestSendsIt() throws Exception {
        // Given
        String body = "{\"dsl\": {\"widgetName\": \"MainContainer\"}, \"expectedRevision\": \"1700000000000\"}";

        // When
        LayoutUpdateDTO dto = objectMapper.readValue(body, LayoutUpdateDTO.class);

        // Then
        assertThat(dto.expectedRevision()).isEqualTo("1700000000000");
        assertThat(dto.toLayout().getDsl().getAsString("widgetName")).isEqualTo("MainContainer");
    }

    @Test
    void should_leaveExpectedRevisionNull_when_requestOmitsIt() throws Exception {
        // Given
        String body = "{\"dsl\": {\"widgetName\": \"MainContainer\"}}";

        // When
        LayoutUpdateDTO dto = objectMapper.readValue(body, LayoutUpdateDTO.class);

        // Then
        assertThat(dto.expectedRevision()).isNull();
        assertThat(dto.toLayout().getRevision()).isNull();
    }
}
