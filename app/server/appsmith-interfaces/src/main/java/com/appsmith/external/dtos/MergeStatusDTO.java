/* Copyright 2019-2023 Appsmith */
package com.appsmith.external.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MergeStatusDTO {

@JsonProperty(value = "isMergeAble")
boolean MergeAble;

// Merge status received from JGIT
String status;

List<String> conflictingFiles;

// Human readable message derived from the status
String message;

String referenceDoc;
}
