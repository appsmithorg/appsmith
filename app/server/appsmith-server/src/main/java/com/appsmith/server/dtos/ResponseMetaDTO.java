package com.appsmith.server.dtos;

import com.appsmith.external.exceptions.ErrorDTO;
import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

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

    @JsonView(Views.Public.class)
    private int status;

    @JsonView(Views.Public.class)
    private String message;

    @JsonView(Views.Public.class)
    private boolean success = true;

    @JsonView(Views.Public.class)
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
