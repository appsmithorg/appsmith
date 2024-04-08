package com.external.plugins.dtos;

import lombok.Data;

import java.util.List;

/**
 * This object is query param that we send to AI server for action executions.
 */
@Data
public class Query {
    String input;
    List<String> labels;
    String instructions; // instruction for AI model about input and labels
    List<String> fileIds;
}
