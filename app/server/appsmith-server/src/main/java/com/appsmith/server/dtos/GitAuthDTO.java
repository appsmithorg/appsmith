/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.dtos;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GitAuthDTO {
@JsonView(Views.Public.class)
String publicKey;

@JsonView(Views.Internal.class)
String privateKey;

@JsonView(Views.Public.class)
String docUrl;

@JsonView(Views.Public.class)
List<GitDeployKeyDTO> gitSupportedSSHKeyType;
}
