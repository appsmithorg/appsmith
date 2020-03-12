package com.appsmith.server.domains;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ActionProvider {
    String name;

    String imageUrl;

    String url;

    String description;

    String credentialSteps;
}
