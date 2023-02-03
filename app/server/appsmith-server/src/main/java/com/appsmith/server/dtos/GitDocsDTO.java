package com.appsmith.server.dtos;

import com.appsmith.external.constants.ErrorReferenceDocUrl;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GitDocsDTO {
    @JsonView(Views.Public.class)
    ErrorReferenceDocUrl docKey;

    @JsonView(Views.Public.class)
    String docUrl;
}
