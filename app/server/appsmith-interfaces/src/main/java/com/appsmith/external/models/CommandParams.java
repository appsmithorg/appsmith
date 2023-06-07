/* Copyright 2019-2023 Appsmith */
package com.appsmith.external.models;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CommandParams {
    List<Param> queryParams;

    List<Param> headerParams;
}
