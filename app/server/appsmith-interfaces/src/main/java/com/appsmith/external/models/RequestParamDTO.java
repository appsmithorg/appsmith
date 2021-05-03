package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

@Setter
@Getter
@ToString
@AllArgsConstructor
public class RequestParamDTO {
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String configProperty; // Only meant for internal use. It won't be returned back to the client.
    private Object value;
    private String label;
    private List<ParsedDataType> types;
}
