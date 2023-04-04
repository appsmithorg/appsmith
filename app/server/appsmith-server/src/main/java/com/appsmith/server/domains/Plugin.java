package com.appsmith.server.domains;

import com.appsmith.server.domains.ce.PluginCE;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class Plugin extends PluginCE {

}
