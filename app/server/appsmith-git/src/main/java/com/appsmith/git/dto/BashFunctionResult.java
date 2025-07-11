package com.appsmith.git.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@AllArgsConstructor
@RequiredArgsConstructor
public class BashFunctionResult {
    private String output;
    private int exitCode;
    private String error;
}
