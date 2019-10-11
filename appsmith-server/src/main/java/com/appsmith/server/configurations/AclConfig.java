package com.appsmith.server.configurations;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class AclConfig {

    @Value("${acl.host}")
    String host;

    @Value("${acl.package.name}")
    String pkgName;

}
