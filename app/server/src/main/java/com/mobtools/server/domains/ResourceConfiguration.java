package com.mobtools.server.domains;

import com.mobtools.server.dtos.AuthenticationDTO;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class ResourceConfiguration extends BaseDomain {

    String url;

    AuthenticationDTO authentication;

    List<Property> properties;

}
