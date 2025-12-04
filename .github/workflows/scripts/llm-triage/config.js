import { readFileSync, existsSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  provider: 'openai',
  trackingLabel: 'AI-Triaged',
  complexityLabels: {
    low: 'Good First Issue',
    medium: 'Inviting Contributions',
    high: 'Needs Engineering Review'
  },
  skipLabels: [
    'Epic',
    'Task',
    'AI-Triaged'
  ],
  targetLabels: [
    'Willing To Contribute'
  ],
  rateLimiting: {
    maxIssuesPerRun: 50,
    delayBetweenIssuesMs: 2000
  },
  timeoutMs: 60000
};

/**
 * Load configuration from YAML file and environment
 * @returns {object} Merged configuration
 */
export function loadConfig() {
  let fileConfig = {};

  // Try to load from YAML config file (located at .github/issue-triage-config.yml)
  const configPath = join(__dirname, '../../../issue-triage-config.yml');
  
  if (existsSync(configPath)) {
    try {
      const configContent = readFileSync(configPath, 'utf8');
      fileConfig = parseYaml(configContent) || {};
      console.log('Loaded config from issue-triage-config.yml');
    } catch (error) {
      console.warn(`Warning: Failed to parse config file: ${error.message}`);
    }
  } else {
    console.log('No config file found, using defaults');
  }

  // Merge with defaults
  const config = deepMerge(DEFAULT_CONFIG, fileConfig);

  // Override with environment variables if present
  if (process.env.TRACKING_LABEL) {
    config.trackingLabel = process.env.TRACKING_LABEL;
  }

  if (process.env.INPUT_LLM_PROVIDER) {
    config.provider = process.env.INPUT_LLM_PROVIDER;
  }

  // Normalize array fields (YAML + deepMerge can convert arrays into objects)
  config.skipLabels = normalizeArray(config.skipLabels);
  config.targetLabels = normalizeArray(config.targetLabels);
  config.rateLimiting = config.rateLimiting || {};

  return config;
}

/**
 * Get API keys from environment
 * @returns {object} API keys object
 */
export function getApiKeys() {
  return {
    openai: process.env.OPENAI_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY
  };
}

/**
 * Get execution context from environment
 * @returns {object} Execution context
 */
export function getExecutionContext() {
  const eventName = process.env.EVENT_NAME || 'unknown';
  const eventAction = process.env.EVENT_ACTION || '';

  return {
    eventName,
    eventAction,
    isWorkflowDispatch: eventName === 'workflow_dispatch',
    isIssueEvent: eventName === 'issues',
    
    // Issue event data
    issueNumber: process.env.ISSUE_NUMBER ? parseInt(process.env.ISSUE_NUMBER, 10) : null,
    issueLabels: parseJsonSafe(process.env.ISSUE_LABELS, []),
    
    // Workflow dispatch inputs
    filterLabels: process.env.INPUT_FILTER_LABELS || 'Willing To Contribute',
    inputIssueNumber: process.env.INPUT_ISSUE_NUMBER 
      ? parseInt(process.env.INPUT_ISSUE_NUMBER, 10) 
      : null,
    forceReanalyze: process.env.INPUT_FORCE_REANALYZE === 'true',
    dryRun: process.env.INPUT_DRY_RUN === 'true',
    
    // Repository info
    repoOwner: process.env.REPO_OWNER || 'appsmithorg',
    repoName: process.env.REPO_NAME || 'appsmith',
    
    // Target label for issue events
    targetLabelOnIssueEvent: process.env.TARGET_LABEL_ON_ISSUE_EVENT || 'Willing To Contribute'
  };
}

/**
 * Deep merge two objects
 * @param {object} target - Target object
 * @param {object} source - Source object
 * @returns {object} Merged object
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
      result[key] = deepMerge(target[key], source[key]);
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }

  return result;
}

/**
 * Safely parse JSON string
 * @param {string} str - JSON string
 * @param {any} defaultValue - Default value if parsing fails
 * @returns {any}
 */
function parseJsonSafe(str, defaultValue) {
  if (!str) return defaultValue;
  
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
}

/**
 * Normalize a value into an array
 * @param {any} value
 * @returns {any[]}
 */
function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value) {
    return [];
  }

  // If value is an object (e.g., {0: 'label'}), convert to array
  if (typeof value === 'object') {
    return Object.values(value);
  }

  // Otherwise, wrap single value into array
  return [value];
}

