# Test Coverage Guide

This guide explains how to generate and view test coverage reports for the Family Planner project.

## Quick Commands

```bash
# Run all tests with coverage and display summary table
npm run test:coverage

# Run tests with coverage and show only the summary table
npm run test:coverage:summary

# Display the coverage table (requires coverage data to exist)
npm run test:coverage:table

# Run tests with detailed text output
npm run test:coverage:detailed
```

## Coverage Table Format

The coverage table displays:
- **File**: Path to each source file
- **Lines**: `covered/total (percentage)`
- **Statements**: `covered/total (percentage)`
- **Functions**: `covered/total (percentage)`
- **Branches**: `covered/total (percentage)`

### Color Coding

- 🟢 **Green** (≥80%): Good coverage
- 🟡 **Yellow** (50-79%): Moderate coverage
- 🔴 **Red** (<50%): Low coverage

## Example Output

```
📊 Test Coverage Summary

────────────────────────────────────────────────────────────────────────────────
File                                                     Lines          Statements     Functions      Branches      
────────────────────────────────────────────────────────────────────────────────

📁 apps/backend
  src/app/app.controller.ts                             10/10 100.00%  10/10 100.00%  2/2 100.00%    0/0 100.00%
  src/app/app.service.ts                                5/8 62.50%     5/8 62.50%     1/2 50.00%     0/2 0.00%

📁 libs/frontend/data-access-auth
  src/lib/store/auth.store.ts                           45/60 75.00%   45/60 75.00%   8/12 66.67%    15/24 62.50%
  src/lib/interceptors/auth.interceptor.ts              20/25 80.00%   20/25 80.00%   4/5 80.00%     8/12 66.67%

────────────────────────────────────────────────────────────────────────────────

🎯 TOTAL COVERAGE
OVERALL                                                  180/250 72.00% 180/250 72.00% 30/45 66.67%   45/80 56.25%

────────────────────────────────────────────────────────────────────────────────

💡 View detailed HTML report: coverage/[project]/index.html
```

## Coverage Files Location

Coverage reports are generated in the `coverage/` directory:

```
coverage/
├── apps/
│   ├── backend/
│   │   ├── index.html          # HTML report for backend
│   │   ├── coverage-summary.json
│   │   └── lcov.info
│   └── frontend/
│       ├── index.html          # HTML report for frontend
│       └── ...
└── libs/
    ├── frontend/
    │   ├── data-access-auth/
    │   │   ├── index.html      # HTML report for lib
    │   │   └── ...
    │   └── ...
    └── backend/
        └── ...
```

## Viewing HTML Reports

Open any `index.html` file in the coverage directory to see:
- Interactive file browser
- Line-by-line coverage highlighting
- Uncovered lines highlighted in red
- Branch coverage details

```bash
# Open frontend app coverage
start coverage/apps/frontend/index.html

# Open backend feature coverage
start coverage/libs/backend/feature-schedule/index.html
```

## CI/CD Integration

The coverage reports are also generated in CI:

```json
{
  "scripts": {
    "test:ci": "nx run-many -t test --configuration=ci"
  }
}
```

This configuration (defined in `nx.json`) automatically enables:
- Coverage collection (`codeCoverage: true`)
- CI mode for consistent output

## Understanding Coverage Metrics

- **Lines**: Percentage of executable lines that were run
- **Statements**: Similar to lines but counts JavaScript statements
- **Functions**: Percentage of functions that were called
- **Branches**: Percentage of conditional branches (if/else, switch, ternary) that were executed

## Best Practices

1. **Aim for >80% coverage** on critical business logic
2. **Focus on branch coverage** to ensure all code paths are tested
3. **Review uncovered lines** in HTML reports to identify gaps
4. **Run coverage locally** before committing changes
5. **Use coverage thresholds** in `jest.preset.js` to enforce minimums

## Troubleshooting

### No coverage data found
```bash
# Solution: Run tests with coverage first
npm run test:coverage:summary
```

### Coverage reports outdated
```bash
# Solution: Delete coverage directory and regenerate
rm -rf coverage
npm run test:coverage
```

### Specific project coverage
```bash
# Run coverage for a specific project
npx nx test backend --coverage
npx nx test frontend-data-access-auth --coverage

# Then view the table
npm run test:coverage:table
```
