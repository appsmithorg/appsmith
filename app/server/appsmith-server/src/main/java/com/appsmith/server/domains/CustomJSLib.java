package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class CustomJSLib extends BaseDomain {
    String name;
    String umdSrcUrl;
    String documentationUrl;
    String version;
    String ternFunctionDefinitions;
}
