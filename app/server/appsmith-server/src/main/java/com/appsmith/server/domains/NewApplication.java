package com.appsmith.server.domains;

import lombok.Getter;
import lombok.Setter;

/**
 * This class is just for demonstration purpose, the changes that appears over here would be taken to
 * application
 */
@Getter
@Setter
public class NewApplication extends ImportableContext {

    String workspaceId;
}
