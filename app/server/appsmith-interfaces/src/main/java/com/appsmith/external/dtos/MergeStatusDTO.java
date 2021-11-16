package com.appsmith.external.dtos;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class MergeStatusDTO {
    boolean isMergeAble;

    String status;

    List<String> conflictingFiles;
}
