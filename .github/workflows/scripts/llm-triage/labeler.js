import { Octokit } from '@octokit/rest';

const TRIAGE_COMMENT_MARKER = '<!-- llm-triage-v1 -->';

/**
 * GitHub Labeler - Handles labeling and commenting on issues
 */
export class GitHubLabeler {
  /**
   * @param {object} options
   * @param {string} options.token - GitHub token
   * @param {string} options.owner - Repository owner
   * @param {string} options.repo - Repository name
   * @param {object} options.config - Triage configuration
   */
  constructor({ token, owner, repo, config }) {
    this.octokit = new Octokit({ auth: token });
    this.owner = owner;
    this.repo = repo;
    this.config = config;
  }

  /**
   * Apply triage results to an issue
   * @param {number} issueNumber - Issue number
   * @param {import('./providers/base.js').TriageResult} result - Triage result
   * @param {object} options - Options
   * @param {boolean} options.dryRun - If true, only comment, don't apply labels
   * @returns {Promise<void>}
   */
  async applyTriageResult(issueNumber, result, options = {}) {
    const { dryRun = false } = options;

    // Get complexity label from config
    const complexityLabel = this.config.complexityLabels[result.complexity];
    const trackingLabel = this.config.trackingLabel;

    console.log(`Applying triage to issue #${issueNumber}:`);
    console.log(`  - Complexity label: ${complexityLabel}`);
    console.log(`  - Tracking label: ${trackingLabel}`);
    console.log(`  - Dry run: ${dryRun}`);

    // Post comment first
    await this.postTriageComment(issueNumber, result, dryRun);

    if (!dryRun) {
      // Add labels
      const labelsToAdd = [trackingLabel];
      
      // Only add complexity label if not "high" (high = needs engineering review, not community)
      if (complexityLabel && result.complexity !== 'high') {
        labelsToAdd.push(complexityLabel);
      }

      // Add any suggested labels from the LLM
      if (result.suggestedLabels && result.suggestedLabels.length > 0) {
        // Filter to only known/valid labels
        const validSuggested = await this.filterValidLabels(result.suggestedLabels);
        labelsToAdd.push(...validSuggested);
      }

      await this.addLabels(issueNumber, labelsToAdd);

      // If high complexity, add the engineering review label
      if (result.complexity === 'high' && this.config.complexityLabels.high) {
        await this.addLabels(issueNumber, [this.config.complexityLabels.high]);
      }
    }
  }

  /**
   * Post a triage comment on the issue
   * @param {number} issueNumber - Issue number
   * @param {import('./providers/base.js').TriageResult} result - Triage result
   * @param {boolean} dryRun - Whether this is a dry run
   */
  async postTriageComment(issueNumber, result, dryRun) {
    const comment = this.formatTriageComment(result, dryRun);

    try {
      await this.octokit.issues.createComment({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        body: comment
      });
      console.log(`Posted triage comment on issue #${issueNumber}`);
    } catch (error) {
      console.error(`Failed to post comment on issue #${issueNumber}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Format the triage comment
   * @param {import('./providers/base.js').TriageResult} result - Triage result
   * @param {boolean} dryRun - Whether this is a dry run
   * @returns {string}
   */
  formatTriageComment(result, dryRun) {
    const complexityEmoji = {
      low: '🟢',
      medium: '🟡',
      high: '🔴'
    };

    const complexityText = {
      low: 'Low - Good for first-time contributors',
      medium: 'Medium - Requires some familiarity with the codebase',
      high: 'High - Requires deep system knowledge'
    };

    const filesSection = result.files.length > 0
      ? `### 📁 Relevant Files\n${result.files.map(f => `- \`${f}\``).join('\n')}`
      : '';

    const effortSection = result.estimatedEffort
      ? `**Estimated Effort:** ${result.estimatedEffort}`
      : '';

    const dryRunNotice = dryRun
      ? '\n\n> ⚠️ **DRY RUN** - No labels were applied. This is a preview only.\n'
      : '';

    return `${TRIAGE_COMMENT_MARKER}
## 🤖 AI Triage Assessment

${complexityEmoji[result.complexity]} **Complexity:** ${complexityText[result.complexity]}

${effortSection}

<details>
<summary>📋 Analysis Details</summary>

### Reasoning
${result.reasoning}

${filesSection}

**Confidence:** ${Math.round(result.confidence * 100)}%

</details>
${dryRunNotice}
---
<sub>This assessment was generated automatically by the LLM Triage system. If you believe this is incorrect, please comment below or contact a maintainer.</sub>
`;
  }

  /**
   * Add labels to an issue
   * @param {number} issueNumber - Issue number
   * @param {string[]} labels - Labels to add
   */
  async addLabels(issueNumber, labels) {
    if (labels.length === 0) return;

    try {
      await this.octokit.issues.addLabels({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        labels
      });
      console.log(`Added labels to issue #${issueNumber}: ${labels.join(', ')}`);
    } catch (error) {
      console.error(`Failed to add labels to issue #${issueNumber}: ${error.message}`);
      // Don't throw - labels might not exist
    }
  }

  /**
   * Check if an issue has already been triaged
   * @param {number} issueNumber - Issue number
   * @returns {Promise<boolean>}
   */
  async isAlreadyTriaged(issueNumber) {
    try {
      // Check for tracking label
      const issue = await this.octokit.issues.get({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber
      });

      const hasTrackingLabel = issue.data.labels.some(
        label => (typeof label === 'string' ? label : label.name) === this.config.trackingLabel
      );

      if (hasTrackingLabel) {
        return true;
      }

      // Check for triage comment marker
      const comments = await this.octokit.issues.listComments({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        per_page: 100
      });

      return comments.data.some(comment => 
        comment.body && comment.body.includes(TRIAGE_COMMENT_MARKER)
      );
    } catch (error) {
      console.error(`Error checking triage status for #${issueNumber}: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if an issue should be skipped based on its labels
   * @param {object} issue - GitHub issue object
   * @returns {boolean}
   */
  shouldSkipIssue(issue) {
    const issueLabels = (issue.labels || []).map(
      l => typeof l === 'string' ? l : l.name
    );

    // Skip if has any skip labels
    const hasSkipLabel = issueLabels.some(
      label => this.config.skipLabels.includes(label)
    );

    if (hasSkipLabel) {
      console.log(`Skipping issue #${issue.number} - has skip label`);
      return true;
    }

    return false;
  }

  /**
   * Get issues matching the filter criteria
   * @param {object} options - Filter options
   * @param {string} options.labels - Comma-separated label filter
   * @param {boolean} options.excludeTriaged - Exclude already triaged issues
   * @returns {Promise<object[]>}
   */
  async getFilteredIssues(options) {
    const { labels, excludeTriaged = true } = options;

    try {
      // Build label query
      const labelQuery = labels
        .split(',')
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .join(',');

      console.log(`Fetching issues with labels: ${labelQuery}`);

      const issues = await this.octokit.paginate(
        this.octokit.issues.listForRepo,
        {
          owner: this.owner,
          repo: this.repo,
          labels: labelQuery,
          state: 'open',
          per_page: 100
        }
      );

      console.log(`Found ${issues.length} issues matching label filter`);

      // Filter out already triaged if needed
      if (excludeTriaged) {
        const filtered = issues.filter(issue => {
          const issueLabels = (issue.labels || []).map(
            l => typeof l === 'string' ? l : l.name
          );
          return !issueLabels.includes(this.config.trackingLabel);
        });
        console.log(`${filtered.length} issues after excluding already triaged`);
        return filtered;
      }

      return issues;
    } catch (error) {
      console.error(`Error fetching issues: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a single issue by number
   * @param {number} issueNumber - Issue number
   * @returns {Promise<object>}
   */
  async getIssue(issueNumber) {
    const response = await this.octokit.issues.get({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber
    });
    return response.data;
  }

  /**
   * Filter labels to only those that exist in the repo
   * @param {string[]} labels - Labels to check
   * @returns {Promise<string[]>}
   */
  async filterValidLabels(labels) {
    try {
      const repoLabels = await this.octokit.paginate(
        this.octokit.issues.listLabelsForRepo,
        {
          owner: this.owner,
          repo: this.repo,
          per_page: 100
        }
      );

      const validLabelNames = new Set(repoLabels.map(l => l.name.toLowerCase()));
      
      return labels.filter(label => 
        validLabelNames.has(label.toLowerCase())
      );
    } catch (error) {
      console.error(`Error fetching repo labels: ${error.message}`);
      return [];
    }
  }
}

