package com.appsmith.external.dtos;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class MergeStatus {
    boolean isMerge;

    List<String> conflictingFiles;
}
