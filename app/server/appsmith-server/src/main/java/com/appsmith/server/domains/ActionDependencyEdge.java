package com.appsmith.server.domains;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ActionDependencyEdge {
    String source;
    String target;
}
