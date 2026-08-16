#!/usr/bin/env node
/**
 * `./scripts/dev friction` - where this repository creaks when you add a
 * feature.
 *
 * Developer experience is a declared priority here, and a priority nobody
 * measures is a slogan. This report answers two questions an agent or a human
 * has right before starting feature work, and it answers them about *this*
 * checkout rather than about repositories in general:
 *
 *   1. Which feedback signals do I have? A feature that touches the database
 *      with no integration profile, or the UI with no visual profile, is
 *      feature work whose proof is somebody clicking around. That is the
 *      expensive kind of friction, and it is visible without running anything.
 *
 *   2. Which parts of the loop are actually slow or flaky? `./scripts/dev`
 *      appends one line per run to .cache/devex/loop.jsonl. This reads the
 *      window and reports medians, tails and failure rates.
 *
 * The report is not a gate. It exits 0 even when it finds something, because a
 * report that can fail a build is a report people stop running. `--strict`
 * opts into a non-zero exit for a repository that wants it in CI, and `--json`
 * prints the same findings for tooling.
 *
 * Budgets are declared, not hidden: the defaults below, overridable per
 * repository with a `devex.budgets` object in package.json (seconds per
 * action). A budget you disagree with should be edited in the open, not
 * silently tolerated.
 *
 * The deriving half is exported and pure. App-plattform's weekly fleet brief
 * imports `evaluateSignals` and reads the same answer for every app over the
 * GitHub API, where no local log exists. Two definitions of "which signals
 * does this repository have" would drift apart within a month.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const DEFAULT_BUDGETS = {
  setup: 300,
  check: 120,
  test: 60,
  typecheck: 60,
  lint: 60,
  build: 240,
  verify: 420,
  integration: 600,
  e2e: 900,
  ui: 900,
};

export const SETUP_CHURN_WINDOW_DAYS = 7;

export function formatSeconds(value) {
  if (value < 90) return `${value}s`;
  const minutes = Math.floor(value / 60);
  return `${minutes}m${String(value % 60).padStart(2, "0")}s`;
}

/**
 * Which feedback signals this repository has, and which ones it is missing for
 * a boundary it actually owns.
 *
 * `has(path)` answers whether a repository-relative path exists, so the same
 * function serves a local checkout and a remote tree listing.
 *
 * `applicable: false` is deliberately different from missing. A stateless API
 * with no integration profile is not creaking; a database-backed app with no
 * integration profile is. Reporting both as gaps trains people to ignore the
 * report.
 */
export function evaluateSignals({ packageJson = {}, has }) {
  const scripts = packageJson.scripts ?? {};
  const dependencies = {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {}),
  };
  const hasDatabase =
    has("prisma/schema.prisma") ||
    has("docker-compose.yml") ||
    has("docker-compose.yaml");
  const hasWebUi = Boolean(dependencies.next || dependencies.react);

  return [
    {
      id: "setup",
      label: "One-command setup",
      command: "./scripts/dev setup",
      applicable: true,
      present: has("scripts/setup-local.sh"),
      cost: "a new contributor or a fresh container has no repeatable way in",
    },
    {
      id: "targeted-test",
      label: "Targeted test",
      command: "./scripts/dev test -- path/to/file.test.ts",
      applicable: true,
      present: Boolean(scripts.test),
      cost: "the smallest signal is a whole-repository run, so iteration is slow",
    },
    {
      id: "check",
      label: "Core loop",
      command: "./scripts/dev check",
      applicable: true,
      present: Boolean(scripts.check),
      cost: "typecheck, lint and unit tests have no single command",
    },
    {
      id: "integration",
      label: "Database boundary",
      command: "./scripts/dev integration",
      applicable: hasDatabase,
      present: has("scripts/run-integration-tests.sh"),
      cost: "a feature that touches the database has no automated proof",
    },
    {
      id: "ui",
      label: "Visual evidence",
      command: "./scripts/dev ui",
      applicable: hasWebUi,
      present: Boolean(scripts["review:ui"] ?? scripts["test:e2e"]),
      cost: "a UI change cannot be seen without a human clicking through it",
    },
    {
      id: "verify",
      label: "Full gate",
      command: "./scripts/dev verify",
      applicable: true,
      present: Boolean(scripts.verify),
      cost: "there is no single command that means the same thing as CI",
    },
  ];
}

/**
 * Actions whose failure means the harness broke, rather than that the gate did
 * its job.
 *
 * `check` going red is the normal shape of development: you write the failing
 * test, then you make it pass. Counting those as unreliability told exactly the
 * person this contract is written for that their working gate cannot be
 * trusted. The exit code alone cannot tell "your code is wrong" from "the tool
 * is broken", so only the actions that are not gates are read that way.
 * `build` is a gate too - it fails on your own type errors - so it is not here.
 */
export const HARNESS_ACTIONS = new Set(["setup", "doctor"]);

/**
 * Actions you keep running while you work.
 *
 * A dev server's duration is how long you had it open, and its exit status is
 * how you stopped it. Neither says anything about this repository's loop, so
 * the measured heuristics skip them entirely. They stay in the log and in the
 * table, because "how often do I restart the dev server" is worth seeing.
 */
export const LONG_LIVED_ACTIONS = new Set(["dev"]);

/** The true median: the average of the middle two when the count is even. */
function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = sorted.length / 2;
  return sorted.length % 2 === 1
    ? sorted[Math.floor(middle)]
    : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

/** One row per action: how often, how slow, how often it failed. */
export function summarizeRuns(runs, budgets = DEFAULT_BUDGETS) {
  const measured = [];
  for (const action of [...new Set(runs.map((run) => run.action))].sort()) {
    const forAction = runs.filter((run) => run.action === action);
    const durations = forAction.map((run) => run.seconds);
    measured.push({
      action,
      runs: forAction.length,
      failures: forAction.filter((run) => run.status !== 0).length,
      median: median(durations),
      slowest: Math.max(...durations),
      budget: budgets[action],
    });
  }
  return measured;
}

export function deriveFindings({
  signals = [],
  measured = [],
  runs = [],
  now = Date.now(),
}) {
  const findings = [];
  for (const signal of signals) {
    if (!signal.applicable || signal.present) continue;
    findings.push({
      kind: "missing-signal",
      subject: signal.id,
      message: `No ${signal.label.toLowerCase()} (${signal.command}): ${signal.cost}.`,
    });
  }
  for (const entry of measured) {
    if (LONG_LIVED_ACTIONS.has(entry.action)) continue;

    if (entry.budget !== undefined && entry.median > entry.budget) {
      findings.push({
        kind: "over-budget",
        subject: entry.action,
        message: `\`${entry.action}\` takes ${formatSeconds(entry.median)} at the median, over its ${formatSeconds(entry.budget)} budget. Every feature pays this on every iteration.`,
      });
    }
    if (
      HARNESS_ACTIONS.has(entry.action) &&
      entry.runs >= 3 &&
      entry.failures / entry.runs >= 1 / 3
    ) {
      findings.push({
        kind: "unreliable",
        subject: entry.action,
        message: `\`${entry.action}\` failed ${entry.failures} of ${entry.runs} runs. This one is not supposed to fail: it is the harness, not a gate.`,
      });
    }
    // A tail far above the median is usually a cold cache or a service that was
    // not warm - which is a setup defect, not a fact of life.
    if (
      entry.runs >= 5 &&
      entry.slowest > entry.median * 3 &&
      entry.slowest - entry.median > 30
    ) {
      findings.push({
        kind: "cold-tail",
        subject: entry.action,
        message: `\`${entry.action}\` ranges from ${formatSeconds(entry.median)} to ${formatSeconds(entry.slowest)}. Something is cold or unwarm on the slow runs.`,
      });
    }
  }
  const recentSetups = runs.filter(
    (run) =>
      run.action === "setup" &&
      Date.parse(run.at ?? "") >
        now - SETUP_CHURN_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).length;
  if (recentSetups >= 5) {
    findings.push({
      kind: "setup-churn",
      subject: "setup",
      message: `\`setup\` ran ${recentSetups} times this week. Setup should be needed once and then be boring; if it is not idempotent for you, that is the bug.`,
    });
  }
  return findings;
}

// ---------------------------------------------------------------------------
// The half that reads this checkout and prints. Everything above is pure, so
// the fleet brief can reuse it without a filesystem.
// ---------------------------------------------------------------------------

function readRuns(logPath) {
  if (!existsSync(logPath)) return [];
  const runs = [];
  for (const line of readFileSync(logPath, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const run = JSON.parse(line);
      if (
        typeof run.action === "string" &&
        Number.isFinite(run.seconds) &&
        Number.isFinite(run.status)
      ) {
        runs.push(run);
      }
    } catch {
      // A local log written by a shell script. One unreadable line is not a
      // reason to refuse the other four hundred.
    }
  }
  return runs.slice(-500);
}

function main(args, root) {
  const strict = args.includes("--strict");
  const asJson = args.includes("--json");
  const logPath = join(root, ".cache", "devex", "loop.jsonl");

  let packageJson = {};
  try {
    packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  } catch {
    // A repository without a readable package.json still gets the file-based
    // half of the answer, which is better than refusing to report at all.
  }
  const budgets = {
    ...DEFAULT_BUDGETS,
    ...(packageJson.devex?.budgets ?? {}),
  };

  const signals = evaluateSignals({
    packageJson,
    has: (path) => existsSync(join(root, path)),
  });
  const runs = readRuns(logPath);
  const measured = summarizeRuns(runs, budgets);
  const findings = deriveFindings({ signals, measured, runs });

  if (asJson) {
    console.log(
      JSON.stringify(
        { app: packageJson.name ?? null, signals, measured, findings },
        null,
        2,
      ),
    );
  } else {
    const name = packageJson.name ?? "this repository";
    console.log(`Developer experience — ${name}`);
    console.log("");
    console.log("Signals you have when you add a feature");
    for (const signal of signals) {
      const state = !signal.applicable
        ? "n/a    "
        : signal.present
          ? "ready  "
          : "MISSING";
      console.log(`  ${state} ${signal.label.padEnd(20)} ${signal.command}`);
      if (signal.applicable && !signal.present) {
        console.log(`          ${signal.cost}`);
      }
    }
    console.log("");

    if (measured.length === 0) {
      console.log("Measured friction");
      console.log(
        "  Nothing recorded yet. Run ./scripts/dev check, then come back.",
      );
    } else {
      console.log(`Measured friction (${runs.length} runs, ${logPath})`);
      console.log(
        `  ${"action".padEnd(12)}${"runs".padEnd(6)}${"fails".padEnd(7)}${"median".padEnd(9)}${"slowest".padEnd(10)}budget`,
      );
      for (const entry of measured) {
        console.log(
          `  ${entry.action.padEnd(12)}${String(entry.runs).padEnd(6)}${String(entry.failures).padEnd(7)}${formatSeconds(entry.median).padEnd(9)}${formatSeconds(entry.slowest).padEnd(10)}${entry.budget === undefined ? "-" : formatSeconds(entry.budget)}`,
        );
      }
    }
    console.log("");

    if (findings.length === 0) {
      console.log("No friction found. Report some when you hit it.");
    } else {
      console.log(`Where it creaks (${findings.length})`);
      for (const finding of findings) console.log(`  - ${finding.message}`);
      console.log("");
      console.log(
        "Friction is a bug here. Fix it in the pull request you are already in",
      );
      console.log(
        "when it is small, and open an issue when it is not. Do not route around",
      );
      console.log("it with a second setup path.");
    }
  }

  if (strict && findings.length > 0) process.exitCode = 1;
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) main(process.argv.slice(2), process.cwd());
