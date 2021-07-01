package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Property;
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
public class PluginSpecification extends BaseDomain {

    String name;

    List<Property> specificationList;
}
