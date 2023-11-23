package com.external.plugins.models;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum EncodingFormat {
    @JsonProperty("base64")
    BASE64,

    @JsonProperty("float")
    FLOAT
}
