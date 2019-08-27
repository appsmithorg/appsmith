package com.appsmith.server.domains;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class PluginParameterType {
    String key;
    String dataType;
}
