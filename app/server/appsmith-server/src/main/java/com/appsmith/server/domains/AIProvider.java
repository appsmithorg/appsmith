package com.appsmith.server.domains;

public enum AIProvider {
    CLAUDE,
    OPENAI,
    @Deprecated
    COPILOT, // Use AZURE_OPENAI instead
    LOCAL_LLM,
    AZURE_OPENAI
}
