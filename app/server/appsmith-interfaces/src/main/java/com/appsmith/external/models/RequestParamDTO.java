package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.List;
import java.util.Map;

@Setter
@Getter
@ToString
@AllArgsConstructor
@JsonPropertyOrder({"value", "psParams", "types", "label", "configProperty"})
public class RequestParamDTO {
    @JsonIgnore
    private String configProperty; // Only meant for internal use. It won't be returned back to the client.
    private Object value;
    @JsonIgnore
    private String label; // Only meant for internal use. It is returned as key for the RequestParamDTO object.
    @JsonIgnore
    private List<ParsedDataType> types; // Not getting used for now but still keeping it here for future use.
    private Map<String, Object> substitutedParams;
}
