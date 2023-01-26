package com.appsmith.server.dtos;

import lombok.Data;
import org.springframework.http.HttpHeaders;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;


@Data
public class ExportFileDTO {
    @JsonView(Views.Public.class)
    HttpHeaders httpHeaders;

    @JsonView(Views.Public.class)
    Object applicationResource;
}
