package com.external.plugins.dto;

import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.SSLDetails;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Data
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArangoDBConnectionProperties {

    List<Endpoint> nonEmptyEndpoints;

    DBAuth auth;

    SSLDetails.AuthType sslAuthType;

    String dbName;

}
