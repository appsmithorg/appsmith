package com.appsmith.server.dtos;

import com.appsmith.external.exceptions.ErrorDTO;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class ResponseMetaDTO {

    private int status;

    private String message;

    private boolean success = true;

    private ErrorDTO error;

    public ResponseMetaDTO(int status, String message, boolean success) {
        this.status = status;
        this.message = message;
        this.success = success;
    }

    public ResponseMetaDTO(int status, String message) {
        this.status = status;
        this.message = message;
    }

    public ResponseMetaDTO(int status, ErrorDTO errorDTO) {
        this.status = status;
        this.error = errorDTO;
        this.success = false;
    }
}
