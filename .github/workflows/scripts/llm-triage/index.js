#!/usr/bin/env node

/**
 * LLM Issue Triage - Main Entry Point
 * 
 * This script analyzes GitHub issues using LLM and applies complexity labels.
 * It can be triggered by:
 * - Issue events (opened, labeled)
 * - Manual workflow dispatch (single issue or bulk)
 */

import { IssueAnalyzer, gatherCodebaseContext } from './analyzer.js';
import { GitHubLabeler } from './labeler.js';
import { loadConfig, getApiKeys, getExecutionContext } from './config.js';

/**
 * Main entry point
 */
async function main() {
  console.log('🚀 LLM Issue Triage starting...\n');

  // Load configuration
  const config = loadConfig();
  const apiKeys = getApiKeys();
  const context = getExecutionContext();

  console.log('Configuration loaded:');
  console.log(`  - Provider: ${config.provider}`);
  console.log(`  - Tracking label: ${config.trackingLabel}`);
  console.log(`  - Event: ${context.eventName}`);
  console.log('');

  // Initialize components
  const labeler = new GitHubLabeler({
    token: process.env.GITHUB_TOKEN,
    owner: context.repoOwner,
    repo: context.repoName,
    config
  });

  const analyzer = new IssueAnalyzer({
    provider: config.provider,
    apiKeys,
    config
  });

  try {
    if (context.isWorkflowDispatch) {
      await handleWorkflowDispatch(analyzer, labeler, config, context);
    } else if (context.isIssueEvent) {
      await handleIssueEvent(analyzer, labeler, config, context);
    } else {
      console.log(`Unknown event type: ${context.eventName}`);
      process.exit(1);
    }

    console.log('\n✅ LLM Issue Triage completed successfully');
  } catch (error) {
    console.error(`\n❌ LLM Issue Triage failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Handle workflow_dispatch event
 */
async function handleWorkflowDispatch(analyzer, labeler, config, context) {
  console.log('📋 Handling workflow_dispatch event');
  console.log(`  - Filter labels: ${context.filterLabels}`);
  console.log(`  - Specific issue: ${context.inputIssueNumber || 'N/A (bulk run)'}`);
  console.log(`  - Force reanalyze: ${context.forceReanalyze}`);
  console.log(`  - Dry run: ${context.dryRun}`);
  console.log('');

  if (context.inputIssueNumber) {
    // Single issue mode
    await processSingleIssue(
      analyzer, 
      labeler, 
      context.inputIssueNumber, 
      config, 
      context
    );
  } else {
    // Bulk mode
    await processBulkIssues(analyzer, labeler, config, context);
  }
}

/**
 * Handle issue event (opened, labeled)
 */
async function handleIssueEvent(analyzer, labeler, config, context) {
  console.log('📋 Handling issue event');
  console.log(`  - Action: ${context.eventAction}`);
  console.log(`  - Issue: #${context.issueNumber}`);
  console.log('');

  if (!context.issueNumber) {
    console.log('No issue number found in event context');
    return;
  }

  // For 'opened' events, check if we should auto-triage
  // For 'labeled' events, check if the target label was added
  const issueLabels = context.issueLabels.map(l => 
    typeof l === 'string' ? l : l.name
  );

  if (context.eventAction === 'labeled') {
    // Check if the added label is our target label
    if (!issueLabels.includes(context.targetLabelOnIssueEvent)) {
      console.log(`Label added is not the target label (${context.targetLabelOnIssueEvent}), skipping`);
      return;
    }
  }

  // Check if already triaged
  const isTriaged = await labeler.isAlreadyTriaged(context.issueNumber);
  if (isTriaged) {
    console.log(`Issue #${context.issueNumber} already triaged, skipping`);
    return;
  }

  // Process the issue
  await processSingleIssue(
    analyzer, 
    labeler, 
    context.issueNumber, 
    config, 
    { ...context, dryRun: false }
  );
}

/**
 * Process a single issue
 */
async function processSingleIssue(analyzer, labeler, issueNumber, config, context) {
  console.log(`\n🔍 Processing issue #${issueNumber}...`);

  // Fetch the issue
  const issue = await labeler.getIssue(issueNumber);

  // Check if should skip
  if (labeler.shouldSkipIssue(issue)) {
    console.log(`Skipping issue #${issueNumber} due to skip labels`);
    return { skipped: true, reason: 'skip_label' };
  }

  // Check if already triaged (unless force reanalyze)
  if (!context.forceReanalyze) {
    const isTriaged = await labeler.isAlreadyTriaged(issueNumber);
    if (isTriaged) {
      console.log(`Issue #${issueNumber} already triaged, skipping`);
      return { skipped: true, reason: 'already_triaged' };
    }
  }

  // Gather codebase context
  const codebaseContext = gatherCodebaseContext(issue);

  // Analyze the issue
  const result = await analyzer.analyzeIssue(issue, codebaseContext);

  // Apply triage result
  await labeler.applyTriageResult(issueNumber, result, { 
    dryRun: context.dryRun 
  });

  return { 
    skipped: false, 
    complexity: result.complexity,
    confidence: result.confidence
  };
}

/**
 * Process multiple issues in bulk
 */
async function processBulkIssues(analyzer, labeler, config, context) {
  console.log('\n📦 Starting bulk processing...');

  // Get filtered issues
  const issues = await labeler.getFilteredIssues({
    labels: context.filterLabels,
    excludeTriaged: !context.forceReanalyze
  });

  if (issues.length === 0) {
    console.log('No issues found matching filter criteria');
    return;
  }

  // Apply rate limiting
  const maxIssues = config.rateLimiting?.maxIssuesPerRun || 50;
  const delayMs = config.rateLimiting?.delayBetweenIssuesMs || 2000;

  const issuesToProcess = issues.slice(0, maxIssues);
  console.log(`Processing ${issuesToProcess.length} issues (max: ${maxIssues})`);

  const results = {
    processed: 0,
    skipped: 0,
    failed: 0,
    byComplexity: { low: 0, medium: 0, high: 0 }
  };

  for (let i = 0; i < issuesToProcess.length; i++) {
    const issue = issuesToProcess[i];
    console.log(`\n[${i + 1}/${issuesToProcess.length}] Processing issue #${issue.number}`);

    try {
      const result = await processSingleIssue(
        analyzer, 
        labeler, 
        issue.number, 
        config, 
        context
      );

      if (result.skipped) {
        results.skipped++;
      } else {
        results.processed++;
        results.byComplexity[result.complexity]++;
      }
    } catch (error) {
      console.error(`Failed to process issue #${issue.number}: ${error.message}`);
      results.failed++;
    }

    // Rate limiting delay (except for last issue)
    if (i < issuesToProcess.length - 1) {
      console.log(`Waiting ${delayMs}ms before next issue...`);
      await sleep(delayMs);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Bulk Processing Summary');
  console.log('='.repeat(50));
  console.log(`Total issues found: ${issues.length}`);
  console.log(`Processed: ${results.processed}`);
  console.log(`Skipped: ${results.skipped}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`\nBy complexity:`);
  console.log(`  - Low: ${results.byComplexity.low}`);
  console.log(`  - Medium: ${results.byComplexity.medium}`);
  console.log(`  - High: ${results.byComplexity.high}`);
  
  if (issues.length > maxIssues) {
    console.log(`\n⚠️ Note: ${issues.length - maxIssues} issues were not processed due to rate limiting.`);
    console.log('Run the workflow again to process more issues.');
  }
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run main
main();

