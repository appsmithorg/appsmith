package com.appsmith.server.exceptions;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class ErrorDTO implements Serializable {

    private int code;

    private String message;

    private String title;

    public ErrorDTO(int code, String message) {
        this.code = code;
        this.message = message;
    }
}
