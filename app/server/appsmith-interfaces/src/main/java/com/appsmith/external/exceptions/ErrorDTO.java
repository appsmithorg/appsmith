package com.appsmith.external.exceptions;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ErrorDTO implements Serializable {

    private String code;

    private String title;

    private String message;

    private String errorType;

    // Document on how to resolve the error
    private String referenceDoc;

    public ErrorDTO(String code, String message) {
        this.code = code;
        this.message = message;
    }

    public ErrorDTO(String code, String errorType, String message, String title) {
        this.code = code;
        this.errorType = errorType;
        this.message = message;
        this.title = title;
    }
}
