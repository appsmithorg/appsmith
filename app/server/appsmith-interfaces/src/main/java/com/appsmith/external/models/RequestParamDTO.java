package com.appsmith.external.models;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import com.fasterxml.jackson.annotation.JsonView;

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
    @JsonView(Views.Internal.class)
    private String configProperty; // Only meant for internal use. It won't be returned back to the client.

    @JsonView(Views.Public.class)
    private Object value;

    @JsonView(Views.Internal.class)
    private String label; // Only meant for internal use. It is returned as key for the RequestParamDTO object.

    @JsonView(Views.Internal.class)
    private List<ParsedDataType> types; // Not getting used for now but still keeping it here for future use.

    @JsonView(Views.Public.class)
    private Map<String, Object> substitutedParams;
}
