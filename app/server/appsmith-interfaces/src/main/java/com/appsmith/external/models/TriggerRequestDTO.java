package com.appsmith.external.models;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class TriggerRequestDTO {
    TriggerRequestType requestType;
    List<String> parameters;
    ClientDataDisplayType displayType;
}
