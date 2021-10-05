package com.appsmith.external.annotations.encryption;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.lang.reflect.Field;

@Getter
@Setter
@AllArgsConstructor
public class CandidateField {
    private Field field;
    private Type type;

    enum Type {
        ANNOTATED_FIELD,
        APPSMITH_FIELD_KNOWN,
        APPSMITH_FIELD_UNKNOWN,
        APPSMITH_FIELD_POLYMORPHIC,
        APPSMITH_LIST_KNOWN,
        APPSMITH_LIST_UNKNOWN,
        APPSMITH_LIST_POLYMORPHIC,
        APPSMITH_MAP_KNOWN,
        APPSMITH_MAP_UNKNOWN,
        APPSMITH_MAP_POLYMORPHIC
    }
}
