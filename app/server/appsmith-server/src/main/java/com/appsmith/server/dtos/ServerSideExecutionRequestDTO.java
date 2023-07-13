package com.appsmith.server.dtos;

import lombok.Data;

@Data
public class ServerSideExecutionRequestDTO {

    String baseUrl;

    String collectionId;

    String actionId;

    Boolean revoke = false;
}
