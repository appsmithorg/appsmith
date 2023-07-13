package com.appsmith.server.dtos;

import lombok.Data;

@Data
public class ServerSideExecutionRequestDTO {

    // This can be captured from web exchange but keeping this flexibility to client side in case the server is hosted
    // under the VPN and APIs are routed via nginx
    String baseUrl;

    String collectionId;

    String actionId;

    Boolean revoke = false;
}
