package com.appsmith.external.models;

import com.appsmith.external.datatypes.ClientDataType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class Param {

    String key;

    String value;

    ClientDataType clientDataType;

    public Param(String key, String value) {
        this.key = key;
        this.value = value;
    }
}
