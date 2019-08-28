package com.appsmith.server.dtos;

import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class ResponseDto<T> implements Serializable {

    private static final long serialVersionUID = 8965011907233699993L;

    private int status;

    private T data;

    private String message;

    private boolean success = true;

    public ResponseDto(int status, T data, String message) {
        this.status = status;
        this.data = data;
        this.message = message;
    }

}
