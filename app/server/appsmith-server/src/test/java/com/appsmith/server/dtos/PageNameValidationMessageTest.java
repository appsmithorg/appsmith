package com.appsmith.server.dtos;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The page create and page update requests reject a name that is not a valid page name with a
 * message that states the page name rule.
 */
class PageNameValidationMessageTest {

    private static final String INVALID_PAGE_NAME_MESSAGE = "The page name is not valid. "
            + "A page name cannot be blank, cannot contain \\ / : < > \" | ? * or control characters, cannot start or end with a dot, cannot be longer than 255 characters, and cannot be a reserved device name such as CON or NUL.";

    private static ValidatorFactory validatorFactory;
    private static Validator validator;

    @BeforeAll
    static void setUp() {
        validatorFactory = Validation.buildDefaultValidatorFactory();
        validator = validatorFactory.getValidator();
    }

    @AfterAll
    static void tearDown() {
        validatorFactory.close();
    }

    @Test
    void should_stateThePageNameRule_when_createRequestNameIsNotValidPageName() {
        // Given
        PageCreationDTO request = new PageCreationDTO(
                "Sales:2024", "0123456789abcdef01234567", List.of(new PageCreationDTO.LayoutDTO(null, null)));

        // When
        List<String> messages = validator.validate(request).stream()
                .map(ConstraintViolation::getMessage)
                .toList();

        // Then
        assertThat(messages).containsExactly(INVALID_PAGE_NAME_MESSAGE);
    }

    @Test
    void should_stateThePageNameRule_when_updateRequestNameIsNotValidPageName() {
        // Given
        PageUpdateDTO request = new PageUpdateDTO("Sales:2024", null, null, null);

        // When
        List<String> messages = validator.validate(request).stream()
                .map(ConstraintViolation::getMessage)
                .toList();

        // Then
        assertThat(messages).containsExactly(INVALID_PAGE_NAME_MESSAGE);
    }

    @Test
    void should_acceptRequests_when_nameIsValidPageName() {
        // Given
        PageCreationDTO createRequest = new PageCreationDTO(
                "Sales.2024 Übersicht", "0123456789abcdef01234567", List.of(new PageCreationDTO.LayoutDTO(null, null)));
        PageUpdateDTO updateRequest = new PageUpdateDTO("Sales.2024 Übersicht", null, null, null);

        // When
        boolean createRequestValid = validator.validate(createRequest).isEmpty();
        boolean updateRequestValid = validator.validate(updateRequest).isEmpty();

        // Then
        assertThat(createRequestValid).isTrue();
        assertThat(updateRequestValid).isTrue();
    }
}
