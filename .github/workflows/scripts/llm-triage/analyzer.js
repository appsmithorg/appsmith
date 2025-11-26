import { createProvider } from './providers/index.js';

/**
 * Issue Analyzer - Analyzes GitHub issues using LLM
 */
export class IssueAnalyzer {
  /**
   * @param {object} options
   * @param {string} options.provider - LLM provider name
   * @param {object} options.apiKeys - API keys for providers
   * @param {object} options.config - Triage configuration
   */
  constructor({ provider, apiKeys, config }) {
    this.provider = createProvider(provider, apiKeys);
    this.config = config;
  }

  /**
   * Analyze a GitHub issue
   * @param {object} issue - GitHub issue object
   * @param {object} codebaseContext - Codebase structure context
   * @returns {Promise<import('./providers/base.js').TriageResult>}
   */
  async analyzeIssue(issue, codebaseContext = {}) {
    const prompt = this.buildIssuePrompt(issue);
    const context = {
      codebaseStructure: this.formatCodebaseContext(codebaseContext)
    };

    console.log(`Analyzing issue #${issue.number}: ${issue.title}`);
    
    const result = await this.provider.analyze(prompt, context);
    
    console.log(`Analysis complete for #${issue.number}:`);
    console.log(`  - Complexity: ${result.complexity}`);
    console.log(`  - Confidence: ${result.confidence}`);
    console.log(`  - Files: ${result.files.length} identified`);

    return result;
  }

  /**
   * Build the prompt for issue analysis
   * @param {object} issue - GitHub issue object
   * @returns {string}
   */
  buildIssuePrompt(issue) {
    const labels = (issue.labels || [])
      .map(l => typeof l === 'string' ? l : l.name)
      .join(', ');

    return `
## Issue #${issue.number}: ${issue.title}

**Labels:** ${labels || 'None'}

**Description:**
${issue.body || 'No description provided.'}

---

Please analyze this issue and provide:
1. Complexity assessment (low/medium/high)
2. Relevant file paths that may need changes
3. Brief reasoning for your assessment
4. Estimated effort to fix

Consider:
- Is this a simple bug fix or a complex feature?
- How many files/components are likely involved?
- Does it require architectural changes?
- Can a community contributor reasonably tackle this without deep system knowledge?
`.trim();
  }

  /**
   * Format codebase context for the LLM
   * @param {object} context - Raw codebase context
   * @returns {string}
   */
  formatCodebaseContext(context) {
    if (!context || Object.keys(context).length === 0) {
      return '';
    }

    const parts = [];

    if (context.directories) {
      parts.push('Key directories:');
      parts.push(context.directories.map(d => `  - ${d}`).join('\n'));
    }

    if (context.recentFiles) {
      parts.push('\nRecently modified files:');
      parts.push(context.recentFiles.map(f => `  - ${f}`).join('\n'));
    }

    if (context.keywords && context.matchedFiles) {
      parts.push(`\nFiles matching keywords from issue:`);
      parts.push(context.matchedFiles.map(f => `  - ${f}`).join('\n'));
    }

    return parts.join('\n');
  }
}

/**
 * Gather codebase context relevant to the issue
 * @param {object} issue - GitHub issue object
 * @returns {object} Codebase context
 */
export function gatherCodebaseContext(issue) {
  // Key directories in Appsmith
  const directories = [
    'app/client/src/widgets/',
    'app/client/src/components/',
    'app/client/src/pages/',
    'app/client/src/sagas/',
    'app/client/src/reducers/',
    'app/client/src/utils/',
    'app/client/src/api/',
    'app/server/appsmith-server/src/main/java/com/appsmith/server/',
    'app/server/appsmith-plugins/',
    'app/server/appsmith-interfaces/',
  ];

  // Extract keywords from issue title and body
  const issueText = `${issue.title} ${issue.body || ''}`.toLowerCase();
  const keywords = extractKeywords(issueText);

  // Map keywords to likely directories
  const matchedFiles = mapKeywordsToFiles(keywords);

  return {
    directories,
    keywords,
    matchedFiles
  };
}

/**
 * Extract relevant keywords from issue text
 * @param {string} text - Issue text
 * @returns {string[]}
 */
function extractKeywords(text) {
  const keywords = [];

  // Widget names
  const widgetPatterns = [
    'table', 'button', 'input', 'select', 'dropdown', 'chart', 'form',
    'modal', 'container', 'list', 'image', 'video', 'map', 'text',
    'datepicker', 'filepicker', 'checkbox', 'radio', 'switch', 'tabs',
    'json', 'iframe', 'audio', 'camera', 'document', 'code', 'divider'
  ];

  // Feature areas
  const featurePatterns = [
    'query', 'api', 'datasource', 'database', 'mongodb', 'postgres',
    'mysql', 'rest', 'graphql', 'authentication', 'authorization',
    'git', 'deploy', 'export', 'import', 'theme', 'binding', 'action',
    'navigation', 'url', 'page', 'workspace', 'application', 'widget',
    'canvas', 'drag', 'drop', 'resize', 'property', 'inspector'
  ];

  // Check for matches
  [...widgetPatterns, ...featurePatterns].forEach(pattern => {
    if (text.includes(pattern)) {
      keywords.push(pattern);
    }
  });

  return [...new Set(keywords)]; // Remove duplicates
}

/**
 * Map keywords to likely file paths
 * @param {string[]} keywords - Extracted keywords
 * @returns {string[]}
 */
function mapKeywordsToFiles(keywords) {
  const fileMap = {
    // Widgets
    'table': ['app/client/src/widgets/TableWidgetV2/', 'app/client/src/widgets/TableWidget/'],
    'button': ['app/client/src/widgets/ButtonWidget/'],
    'input': ['app/client/src/widgets/InputWidgetV2/', 'app/client/src/widgets/InputWidget/'],
    'select': ['app/client/src/widgets/SelectWidget/', 'app/client/src/widgets/MultiSelectWidgetV2/'],
    'dropdown': ['app/client/src/widgets/SelectWidget/'],
    'chart': ['app/client/src/widgets/ChartWidget/'],
    'form': ['app/client/src/widgets/FormWidget/'],
    'modal': ['app/client/src/widgets/ModalWidget/'],
    'list': ['app/client/src/widgets/ListWidgetV2/', 'app/client/src/widgets/ListWidget/'],
    'datepicker': ['app/client/src/widgets/DatePickerWidget2/'],
    'filepicker': ['app/client/src/widgets/FilepickerWidget/'],
    'tabs': ['app/client/src/widgets/TabsWidget/'],
    'json': ['app/client/src/widgets/JSONFormWidget/'],
    
    // Features
    'query': ['app/client/src/sagas/QueryPaneSagas.ts', 'app/client/src/pages/Editor/QueryEditor/'],
    'api': ['app/client/src/sagas/ApiPaneSagas.ts', 'app/client/src/pages/Editor/APIEditor/'],
    'datasource': ['app/client/src/pages/Editor/DataSourceEditor/', 'app/server/appsmith-server/src/main/java/com/appsmith/server/datasources/'],
    'git': ['app/client/src/pages/Editor/gitSync/', 'app/server/appsmith-git/'],
    'theme': ['app/client/src/widgets/theming/', 'app/client/src/selectors/themeSelectors.ts'],
    'binding': ['app/client/src/workers/Evaluation/', 'app/client/src/utils/DynamicBindingUtils.ts'],
    'canvas': ['app/client/src/pages/Editor/WidgetsEditor/', 'app/client/src/layoutSystems/'],
    'property': ['app/client/src/pages/Editor/PropertyPane/'],
    
    // Database plugins
    'mongodb': ['app/server/appsmith-plugins/mongoPlugin/'],
    'postgres': ['app/server/appsmith-plugins/postgresPlugin/'],
    'mysql': ['app/server/appsmith-plugins/mysqlPlugin/'],
    'graphql': ['app/server/appsmith-plugins/graphqlPlugin/'],
    'rest': ['app/server/appsmith-plugins/restApiPlugin/'],
  };

  const files = [];
  keywords.forEach(keyword => {
    if (fileMap[keyword]) {
      files.push(...fileMap[keyword]);
    }
  });

  return [...new Set(files)]; // Remove duplicates
}

