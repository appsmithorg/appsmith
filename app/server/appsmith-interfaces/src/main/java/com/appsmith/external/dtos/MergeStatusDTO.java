package com.appsmith.external.dtos;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class MergeStatusDTO {

    @JsonProperty(value="isMergeAble")
    @JsonView(Views.Public.class)
    boolean MergeAble;

    // Merge status received from JGIT
    @JsonView(Views.Public.class)
    String status;

    @JsonView(Views.Public.class)
    List<String> conflictingFiles;

    // Human readable message derived from the status
    @JsonView(Views.Public.class)
    String message;

    @JsonView(Views.Public.class)
    String referenceDoc;
}
