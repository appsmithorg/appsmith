package com.appsmith.server.domains;

import com.appsmith.server.domains.ce.NewActionCE;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@ToString(callSuper = true)
@NoArgsConstructor
@Document
public class NewAction extends NewActionCE {}
