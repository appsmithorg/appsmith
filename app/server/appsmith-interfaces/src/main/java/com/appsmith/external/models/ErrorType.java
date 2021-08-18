package com.appsmith.external.models;

import lombok.Getter;

@Getter
public enum ErrorType {
    ARGUMENT_ERROR,
    CONFIGURATION_ERROR,
    CONNECTIVITY_ERROR,
    AUTHENTICATION_ERROR,
    API_ERROR,
    BAD_REQUEST,
    INTERNAL_ERROR
}

