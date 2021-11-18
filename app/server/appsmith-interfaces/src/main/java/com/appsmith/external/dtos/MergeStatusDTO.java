package com.appsmith.external.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class MergeStatusDTO {

    @JsonProperty(value="isMergeAble")
    boolean MergeAble;

    String status;

    List<String> conflictingFiles;
}
