package com.appsmith.server.domains;

import com.appsmith.server.domains.ce.UserMcpTokenCE;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Community token persistence model. Enterprise overlays must extend the matching CE MCP token seams rather than
 * replacing this collection or authentication contract.
 */
@Document
public class UserMcpToken extends UserMcpTokenCE {}
