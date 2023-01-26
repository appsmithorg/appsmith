package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@AllArgsConstructor
@JsonPropertyOrder({"value", "type"})
public class PsParameterDTO {
    @JsonView(Views.Public.class)
    String value;

    @JsonView(Views.Public.class)
    String type;
}
