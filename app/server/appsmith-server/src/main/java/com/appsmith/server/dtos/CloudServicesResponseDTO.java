package com.appsmith.server.dtos;

public record CloudServicesResponseDTO<T>(ResponseMetaDTO responseMeta, T data) {
    private record ResponseMetaDTO(Integer status, Boolean success) {}
}
