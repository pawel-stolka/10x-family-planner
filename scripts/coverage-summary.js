#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script to generate a formatted coverage summary table
 * Reads coverage-summary.json files from all projects and displays them in a table
 */

function findCoverageSummaries(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        findCoverageSummaries(filePath, results);
      }
    } else if (file === 'coverage-summary.json') {
      results.push(filePath);
    }
  }
  
  return results;
}

function formatPercentage(pct) {
  const color = pct >= 80 ? '\x1b[32m' : pct >= 50 ? '\x1b[33m' : '\x1b[31m';
  const reset = '\x1b[0m';
  return `${color}${pct.toFixed(2)}%${reset}`;
}

function generateTable() {
  const coverageDir = path.join(process.cwd(), 'coverage');
  
  if (!fs.existsSync(coverageDir)) {
    console.error('❌ No coverage directory found. Run tests with coverage first:');
    console.error('   npm run test:coverage');
    process.exit(1);
  }

  const summaryFiles = findCoverageSummaries(coverageDir);
  
  if (summaryFiles.length === 0) {
    console.error('❌ No coverage-summary.json files found in coverage directory');
    process.exit(1);
  }

  const allData = [];
  
  summaryFiles.forEach(summaryFile => {
    const data = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
    const projectPath = path.relative(coverageDir, path.dirname(summaryFile));
    
    Object.entries(data).forEach(([filePath, coverage]) => {
      if (filePath !== 'total') {
        allData.push({
          project: projectPath,
          file: filePath,
          lines: coverage.lines,
          statements: coverage.statements,
          functions: coverage.functions,
          branches: coverage.branches,
        });
      }
    });
  });

  if (allData.length === 0) {
    console.log('⚠️  No coverage data found');
    return;
  }

  // Print header
  console.log('\n📊 Test Coverage Summary\n');
  console.log('─'.repeat(140));
  console.log(
    'File'.padEnd(70) +
    'Lines'.padEnd(15) +
    'Statements'.padEnd(15) +
    'Functions'.padEnd(15) +
    'Branches'.padEnd(15)
  );
  console.log('─'.repeat(140));

  // Group by project
  const byProject = {};
  allData.forEach(item => {
    if (!byProject[item.project]) {
      byProject[item.project] = [];
    }
    byProject[item.project].push(item);
  });

  // Print each project
  Object.entries(byProject).forEach(([project, files]) => {
    console.log(`\n📁 ${project}`);
    
    files.forEach(item => {
      const fileName = path.basename(item.file);
      const shortPath = item.file.length > 65 ? '...' + item.file.slice(-62) : item.file;
      
      const lines = `${item.lines.covered}/${item.lines.total}`.padEnd(8) + formatPercentage(item.lines.pct);
      const statements = `${item.statements.covered}/${item.statements.total}`.padEnd(8) + formatPercentage(item.statements.pct);
      const functions = `${item.functions.covered}/${item.functions.total}`.padEnd(8) + formatPercentage(item.functions.pct);
      const branches = `${item.branches.covered}/${item.branches.total}`.padEnd(8) + formatPercentage(item.branches.pct);
      
      console.log(
        '  ' + shortPath.padEnd(68) +
        lines.padEnd(23) +
        statements.padEnd(23) +
        functions.padEnd(23) +
        branches
      );
    });
  });

  console.log('\n' + '─'.repeat(140));
  
  // Calculate totals
  const totals = {
    lines: { covered: 0, total: 0 },
    statements: { covered: 0, total: 0 },
    functions: { covered: 0, total: 0 },
    branches: { covered: 0, total: 0 },
  };

  allData.forEach(item => {
    totals.lines.covered += item.lines.covered;
    totals.lines.total += item.lines.total;
    totals.statements.covered += item.statements.covered;
    totals.statements.total += item.statements.total;
    totals.functions.covered += item.functions.covered;
    totals.functions.total += item.functions.total;
    totals.branches.covered += item.branches.covered;
    totals.branches.total += item.branches.total;
  });

  const totalLinesPct = totals.lines.total > 0 ? (totals.lines.covered / totals.lines.total) * 100 : 0;
  const totalStmtsPct = totals.statements.total > 0 ? (totals.statements.covered / totals.statements.total) * 100 : 0;
  const totalFuncsPct = totals.functions.total > 0 ? (totals.functions.covered / totals.functions.total) * 100 : 0;
  const totalBranchesPct = totals.branches.total > 0 ? (totals.branches.covered / totals.branches.total) * 100 : 0;

  console.log('\n🎯 TOTAL COVERAGE');
  console.log(
    'OVERALL'.padEnd(70) +
    `${totals.lines.covered}/${totals.lines.total}`.padEnd(8) + formatPercentage(totalLinesPct).padEnd(23) +
    `${totals.statements.covered}/${totals.statements.total}`.padEnd(8) + formatPercentage(totalStmtsPct).padEnd(23) +
    `${totals.functions.covered}/${totals.functions.total}`.padEnd(8) + formatPercentage(totalFuncsPct).padEnd(23) +
    `${totals.branches.covered}/${totals.branches.total}`.padEnd(8) + formatPercentage(totalBranchesPct)
  );
  
  console.log('─'.repeat(140) + '\n');
  console.log('💡 View detailed HTML report: coverage/[project]/index.html\n');
}

generateTable();
