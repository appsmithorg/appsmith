package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
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
    String value;
    String type;
}
