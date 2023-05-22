/* Copyright 2019-2023 Appsmith */
package com.appsmith.external.dtos;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ParamProperty {

  Object datatype;

  List<String> blobIdentifiers;
}
