/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.dtos;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MockDataDTO {

  String id;

  List<MockDataSet> mockdbs;

  List<MockDataCredentials> credentials;

  String name;
}
