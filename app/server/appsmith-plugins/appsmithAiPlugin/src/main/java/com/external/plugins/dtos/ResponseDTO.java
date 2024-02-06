package com.external.plugins.dtos;

import lombok.Data;

@Data
public class ResponseDTO<T> {
    boolean success;
    T data;
}
