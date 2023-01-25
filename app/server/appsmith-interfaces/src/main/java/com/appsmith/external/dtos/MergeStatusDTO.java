package com.appsmith.external.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class MergeStatusDTO {

    @JsonProperty(value="isMergeAble")
    @JsonView(Views.Api.class)
    boolean MergeAble;

    // Merge status received from JGIT
    @JsonView(Views.Api.class)
    String status;

    @JsonView(Views.Api.class)
    List<String> conflictingFiles;

    // Human readable message derived from the status
    @JsonView(Views.Api.class)
    String message;

    @JsonView(Views.Api.class)
    String referenceDoc;
}
