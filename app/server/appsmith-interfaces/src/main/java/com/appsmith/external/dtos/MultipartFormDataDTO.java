package com.appsmith.external.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class MultipartFormDataDTO {
    @JsonView(Views.Api.class)
    String name;

    @JsonView(Views.Api.class)
    String type;

    @JsonView(Views.Api.class)
    Object data;
}
