package com.appsmith.server.domains;

import com.appsmith.server.domains.ce.ActionCE;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@ToString(callSuper = true)
@NoArgsConstructor
@Document(collection = "newAction")
public class Action extends ActionCE {}
