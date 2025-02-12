package com.appsmith.external.constants.spans;

import com.appsmith.external.constants.spans.ce.ConsolidatedApiSpanNamesCE;

/**
 * Please make sure that all span names start with `appsmith.` because span with any other naming format would get
 * dropped / ignored as defined in TracingConfig.java
 */
public class ConsolidatedApiSpanNames extends ConsolidatedApiSpanNamesCE {}
