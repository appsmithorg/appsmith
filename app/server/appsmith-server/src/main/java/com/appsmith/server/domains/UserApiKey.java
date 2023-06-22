package com.appsmith.server.domains;

import com.appsmith.external.annotations.encryption.Encrypted;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@ToString
@Document
public class UserApiKey extends BaseDomain {
    @JsonView({Views.Internal.class})
    @Encrypted
    private String apiKey;
    @JsonView({Views.Internal.class})
    private String userId;
}
