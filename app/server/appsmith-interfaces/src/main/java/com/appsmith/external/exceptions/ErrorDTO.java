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

    private int code;

    private String message;

    private String errorType;

    // Document on how to resolve the error
    private String referenceDoc;

    public ErrorDTO(int code, String message) {
        this.code = code;
        this.message = message;
    }
}
