package com.appsmith.server.dtos;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@ToString
@JsonTypeInfo(
        use = JsonTypeInfo.Id.MINIMAL_CLASS,
        include = JsonTypeInfo.As.EXISTING_PROPERTY,
        visible = true,
        property = "type",
        defaultImpl = TestChild.class)
public abstract class TestParent {
    String testField;
    String type;
}
