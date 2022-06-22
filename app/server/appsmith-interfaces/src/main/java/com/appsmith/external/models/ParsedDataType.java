package com.appsmith.external.models;

import com.appsmith.external.constants.DisplayAppsmithType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@AllArgsConstructor
public class ParsedAppsmithType {
    private final DisplayAppsmithType AppsmithType;
}
