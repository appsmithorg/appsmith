/* Copyright 2019-2023 Appsmith */
package com.appsmith.external.models;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CommandParams {
List<Param> queryParams;

List<Param> headerParams;
}
