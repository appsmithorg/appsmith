package com.appsmith.external.models;

import com.appsmith.external.datatypes.ClientDataType;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

@Getter
@Setter
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class Param {

    @JsonView(Views.Api.class)
    String key;

    @JsonView(Views.Api.class)
    String value;

    @JsonView(Views.Api.class)
    ClientDataType clientDataType;

    //The type of each array elements are stored in this variable when the clientDataType is of ARRAY type and null otherwise
    @JsonView(Views.Api.class)
    List<ClientDataType> dataTypesOfArrayElements;

    /*
        In execute API the parameter map is sent this way {"Text1.text": "k1","Table1.data": "k2", "Api1.data": "k3"} where the key
        is the original name of the binding parameter and value is the pseudo name of the original binding parameter with a view to reducing the size of the payload.
        We will store the pseudo binding name in this variable named pseudoBindingName
     */
    @JsonView(Views.Api.class)
    String pseudoBindingName;

    public Param(String key, String value) {
        this.key = key;
        this.value = value;
    }
}
