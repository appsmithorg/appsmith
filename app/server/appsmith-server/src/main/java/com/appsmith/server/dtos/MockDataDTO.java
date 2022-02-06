package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class MockDataDTO {
    String id;

    List<MockDataSet> mockdbs;

    List<MockDataCredentials> credentials;

    String name;
}
