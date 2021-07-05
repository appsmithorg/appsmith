package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;
import net.minidev.json.JSONObject;

@Getter
@Setter
public class MockDataDTO {
    String id;

    JSONObject mockdbs;

    JSONObject credentials;

    String name;
}
