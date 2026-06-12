#!/usr/bin/env node
/**
 * Agentic usability tester — Claude uses the real app like a human and reports friction.
 *
 * How it works: for each persona/task in personas.json, Claude gets a screenshot +
 * accessibility tree of the live emulator screen, decides one action (tap / swipe /
 * type / wait), the action runs over adb, and the new screen comes back. Along the
 * way it logs findings against tester/heuristics.md. Output is a markdown report,
 * a findings.json (Bug-Lord-ready), and every screenshot.
 *
 * It does NOT file GitHub issues and it never closes anything — R-015: only Patrick
 * closes tickets, on-device. Findings are written for a human to triage.
 *
 * Requirements: a booted emulator/device on adb with the APK installed,
 * ANTHROPIC_API_KEY in the environment.
 *
 * Usage:
 *   node tester/agent.mjs                          # all personas
 *   PERSONAS=weeknight-rush node tester/agent.mjs  # subset (comma-separated ids)
 */

import Anthropic from '@anthropic-ai/sdk';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const APP_ID = process.env.APP_ID ?? 'com.patricknasr.tuckerspice';
const MODEL = process.env.MODEL ?? 'claude-opus-4-8';
const RUN_DIR = path.join(
  __dirname,
  'output',
  process.env.RUN_LABEL ?? new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19),
);

const client = new Anthropic({ maxRetries: 4 });

// ---------------------------------------------------------------------------
// adb helpers
// ---------------------------------------------------------------------------

async function adb(...args) {
  const { stdout } = await exec('adb', args, { maxBuffer: 32 * 1024 * 1024 });
  return stdout;
}

async function screenshotBase64() {
  const { stdout } = await exec('adb', ['exec-out', 'screencap', '-p'], {
    encoding: 'buffer',
    maxBuffer: 32 * 1024 * 1024,
  });
  return stdout.toString('base64');
}

/**
 * Accessibility-tree summary: every node with text or a content-desc, plus its
 * tap point. This gives Claude exact coordinates for labelled elements so taps
 * land precisely; the screenshot covers everything unlabelled. Raw uiautomator
 * XML is tens of KB — this trims it to a token-cheap list.
 */
async function uiTreeSummary() {
  try {
    await adb('shell', 'uiautomator', 'dump', '/sdcard/window_dump.xml');
    const xml = await adb('exec-out', 'cat', '/sdcard/window_dump.xml');
    const lines = [];
    for (const node of xml.matchAll(/<node[^>]*\/?>(?:<\/node>)?/g)) {
      const attrs = node[0];
      const get = (name) => (attrs.match(new RegExp(`${name}="([^"]*)"`)) ?? [])[1] ?? '';
      const text = get('text');
      const desc = get('content-desc');
      const label = text || desc;
      if (!label) continue;
      const b = get('bounds').match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
      if (!b) continue;
      const cx = Math.round((+b[1] + +b[3]) / 2);
      const cy = Math.round((+b[2] + +b[4]) / 2);
      const clickable = get('clickable') === 'true' ? ' clickable' : '';
      lines.push(`"${label.slice(0, 60)}" @ (${cx},${cy})${clickable}`);
      if (lines.length >= 80) break;
    }
    return lines.length ? lines.join('\n') : '(no labelled elements found)';
  } catch {
    return '(accessibility tree unavailable — use the screenshot)';
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function freshAppLaunch() {
  await adb('shell', 'pm', 'clear', APP_ID).catch(() => {});
  await adb('shell', 'monkey', '-p', APP_ID, '-c', 'android.intent.category.LAUNCHER', '1');
  // Cold start on a CI emulator includes DB init + seed; give it room.
  await sleep(12000);
}

// ---------------------------------------------------------------------------
// Tools the persona-agent can use
// ---------------------------------------------------------------------------

const tools = [
  {
    name: 'tap',
    description:
      'Tap the screen at pixel coordinates. Prefer coordinates from the accessibility tree when the target is labelled; otherwise estimate from the screenshot.',
    input_schema: {
      type: 'object',
      properties: {
        x: { type: 'integer' },
        y: { type: 'integer' },
        target: { type: 'string', description: 'What you believe you are tapping, e.g. "Pantry tab"' },
      },
      required: ['x', 'y', 'target'],
    },
  },
  {
    name: 'swipe',
    description: 'Swipe/scroll. Use a slow swipe (600ms+) for scrolling lists, fast for dismissing.',
    input_schema: {
      type: 'object',
      properties: {
        x1: { type: 'integer' },
        y1: { type: 'integer' },
        x2: { type: 'integer' },
        y2: { type: 'integer' },
        duration_ms: { type: 'integer', description: 'Default 600' },
      },
      required: ['x1', 'y1', 'x2', 'y2'],
    },
  },
  {
    name: 'type_text',
    description: 'Type into the currently focused text field. Tap the field first. ASCII only.',
    input_schema: {
      type: 'object',
      properties: { text: { type: 'string' } },
      required: ['text'],
    },
  },
  {
    name: 'press_key',
    description: 'Press a hardware/system key.',
    input_schema: {
      type: 'object',
      properties: { key: { type: 'string', enum: ['back', 'enter', 'home'] } },
      required: ['key'],
    },
  },
  {
    name: 'wait',
    description: 'Wait for an animation, load, or timer. Use sparingly.',
    input_schema: {
      type: 'object',
      properties: { seconds: { type: 'integer', description: '1-10' } },
      required: ['seconds'],
    },
  },
  {
    name: 'log_finding',
    description:
      'Record a usability finding the moment you hit it. One finding per distinct issue; do not re-log the same issue twice.',
    input_schema: {
      type: 'object',
      properties: {
        severity: { type: 'string', enum: ['blocker', 'major', 'minor', 'polish'] },
        heuristic: { type: 'string', description: 'Rubric item, e.g. "B12 messy-hands operation"' },
        title: { type: 'string', description: 'One line, plain English' },
        detail: { type: 'string', description: 'What happened, where, and why it hurt the persona' },
        recommendation: { type: 'string', description: 'The smallest fix that resolves it' },
      },
      required: ['severity', 'heuristic', 'title', 'detail'],
    },
  },
  {
    name: 'finish_task',
    description: 'End the task. Call when the success criteria are met, or when the persona would realistically give up.',
    input_schema: {
      type: 'object',
      properties: {
        outcome: { type: 'string', enum: ['success', 'gave_up'] },
        summary: { type: 'string', description: 'Verdict first: did the app feel like a calm head chef or a maze?' },
      },
      required: ['outcome', 'summary'],
    },
  },
];

// ---------------------------------------------------------------------------
// Context hygiene: keep only the newest screenshots in history
// ---------------------------------------------------------------------------

const KEEP_IMAGES = 2;

function pruneOldScreenshots(messages) {
  let seen = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const content = messages[i].content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (block.type !== 'tool_result' || !Array.isArray(block.content)) continue;
      for (let j = block.content.length - 1; j >= 0; j--) {
        if (block.content[j].type === 'image') {
          seen += 1;
          if (seen > KEEP_IMAGES) {
            block.content[j] = { type: 'text', text: '[earlier screenshot removed to save context]' };
          }
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// One persona task = one agentic session
// ---------------------------------------------------------------------------

const heuristics = fs.readFileSync(path.join(__dirname, 'heuristics.md'), 'utf8');

function systemPrompt(persona, task) {
  return `You are a usability tester embodying a real person using "Tucker & Spice", a recipe and meal-planning Android app for an Australian audience. You control a live device through tools and you judge the experience against the rubric below.

WHO YOU ARE
${persona.profile}

YOUR TASK
${task.goal}
Success means: ${task.success_criteria}

HOW TO BEHAVE
- Act like the persona, not like a developer. If the persona would hesitate, hesitate; if they'd give up, give up (call finish_task with "gave_up") — a realistic abandonment is more valuable than a forced success.
- After every action you receive a fresh screenshot and an accessibility-tree listing with exact tap coordinates for labelled elements. Look at the screenshot before acting; never tap blind.
- If a tap does nothing, that itself is a finding — log it, then try once more or try another way.
- Log findings with log_finding the moment you hit friction, judged against the rubric. Findings are problems only; anything that genuinely delighted the persona goes in the finish_task summary instead.
- Count your own wasted actions honestly. Backtracking, mis-taps caused by the UI, and re-reading are friction.
- The app's accessibility labels matter: an unlabelled control you could only find visually is itself a finding (rubric D20).
- You have a budget of ${task.max_steps} actions. Finish before it runs out.

RUBRIC
${heuristics}`;
}

async function captureToolResult(taskDir, step) {
  const shot = await screenshotBase64();
  fs.writeFileSync(path.join(taskDir, `step-${String(step).padStart(2, '0')}.png`), Buffer.from(shot, 'base64'));
  const tree = await uiTreeSummary();
  return [
    { type: 'text', text: `Current screen — labelled elements with tap points:\n${tree}` },
    { type: 'image', source: { type: 'base64', media_type: 'image/png', data: shot } },
  ];
}

async function performAction(name, input) {
  switch (name) {
    case 'tap':
      await adb('shell', 'input', 'tap', String(input.x), String(input.y));
      await sleep(1500);
      return `Tapped (${input.x},${input.y}) — "${input.target}".`;
    case 'swipe':
      await adb('shell', 'input', 'swipe', String(input.x1), String(input.y1), String(input.x2), String(input.y2), String(input.duration_ms ?? 600));
      await sleep(1000);
      return 'Swiped.';
    case 'type_text': {
      const safe = input.text.replace(/[^\x20-\x7E]/g, '').replace(/ /g, '%s');
      await adb('shell', 'input', 'text', safe);
      await sleep(800);
      return `Typed "${input.text}".`;
    }
    case 'press_key': {
      const codes = { back: 'KEYCODE_BACK', enter: 'KEYCODE_ENTER', home: 'KEYCODE_HOME' };
      await adb('shell', 'input', 'keyevent', codes[input.key]);
      await sleep(1000);
      return `Pressed ${input.key}.`;
    }
    case 'wait':
      await sleep(Math.min(input.seconds, 10) * 1000);
      return `Waited ${Math.min(input.seconds, 10)}s.`;
    default:
      return `Unknown action ${name}.`;
  }
}

async function runTask(persona, task) {
  const taskDir = path.join(RUN_DIR, `${persona.id}--${task.id}`);
  fs.mkdirSync(taskDir, { recursive: true });

  console.log(`\n=== ${persona.name}: ${task.id} ===`);
  await freshAppLaunch();

  const findings = [];
  const actionLog = [];
  let result = { outcome: 'budget_exhausted', summary: 'Ran out of action budget before finishing.' };
  let taps = 0;
  let step = 0;
  const started = Date.now();

  const messages = [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'The app has just cold-launched with fresh state. Begin your task.' },
        ...(await captureToolResult(taskDir, step)),
      ],
    },
  ];

  // Manual agentic loop: act → observe → act, until finish_task or budget.
  while (step < task.max_steps) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      system: systemPrompt(persona, task),
      tools,
      messages,
    });

    if (response.stop_reason === 'refusal') {
      result = { outcome: 'gave_up', summary: 'Model refused to continue (safety classifier).' };
      break;
    }

    messages.push({ role: 'assistant', content: response.content });

    const toolUses = response.content.filter((b) => b.type === 'tool_use');
    if (toolUses.length === 0) break; // model stopped without finish_task — treat as done

    const toolResults = [];
    let finished = false;

    for (const use of toolUses) {
      if (use.name === 'finish_task') {
        result = { outcome: use.input.outcome, summary: use.input.summary };
        toolResults.push({ type: 'tool_result', tool_use_id: use.id, content: 'Task ended.' });
        finished = true;
        continue;
      }
      if (use.name === 'log_finding') {
        findings.push({ ...use.input, persona: persona.id, task: task.id, atStep: step });
        console.log(`  [${use.input.severity}] ${use.input.title}`);
        toolResults.push({ type: 'tool_result', tool_use_id: use.id, content: 'Finding recorded.' });
        continue;
      }
      step += 1;
      if (['tap', 'type_text', 'swipe'].includes(use.name)) taps += 1;
      let note;
      try {
        note = await performAction(use.name, use.input);
      } catch (err) {
        note = `Action failed at the adb level: ${err.message}`;
      }
      actionLog.push(`${step}. ${note}`);
      console.log(`  ${step}. ${note}`);
      toolResults.push({
        type: 'tool_result',
        tool_use_id: use.id,
        content: [{ type: 'text', text: note }, ...(await captureToolResult(taskDir, step))],
      });
    }

    messages.push({ role: 'user', content: toolResults });
    pruneOldScreenshots(messages);
    if (finished) break;
  }

  return {
    persona: persona.id,
    personaName: persona.name,
    task: task.id,
    goal: task.goal,
    ...result,
    actions: step,
    interactions: taps,
    durationSec: Math.round((Date.now() - started) / 1000),
    findings,
    actionLog,
  };
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

function writeReport(runs) {
  const all = runs.flatMap((r) => r.findings);
  const order = { blocker: 0, major: 1, minor: 2, polish: 3 };
  all.sort((a, b) => order[a.severity] - order[b.severity]);

  const lines = [
    '# Usability test report — agentic tester',
    '',
    `Run: ${path.basename(RUN_DIR)} · Model: ${MODEL} · Build: ${process.env.BUILD_INFO ?? 'local'}`,
    '',
    '## Verdict',
    '',
    `${runs.filter((r) => r.outcome === 'success').length}/${runs.length} tasks succeeded. ` +
      `${all.filter((f) => f.severity === 'blocker').length} blockers, ${all.filter((f) => f.severity === 'major').length} major findings.`,
    '',
    '| Persona | Task | Outcome | Interactions | Findings |',
    '|---|---|---|---|---|',
    ...runs.map(
      (r) => `| ${r.personaName} | ${r.task} | ${r.outcome} | ${r.interactions} | ${r.findings.length} |`,
    ),
    '',
    '## Findings (worst first)',
    '',
  ];

  for (const f of all) {
    lines.push(`### [${f.severity.toUpperCase()}] ${f.title}`);
    lines.push(`- **Heuristic:** ${f.heuristic}`);
    lines.push(`- **Seen by:** ${f.persona} during ${f.task} (step ${f.atStep} — screenshot \`${f.persona}--${f.task}/step-${String(f.atStep).padStart(2, '0')}.png\`)`);
    lines.push(`- **What happened:** ${f.detail}`);
    if (f.recommendation) lines.push(`- **Suggested fix:** ${f.recommendation}`);
    lines.push('');
  }

  lines.push('## Per-task summaries', '');
  for (const r of runs) {
    lines.push(`### ${r.personaName} — ${r.task} (${r.outcome}, ${r.interactions} interactions, ${r.durationSec}s)`);
    lines.push('', `> ${r.summary}`, '');
  }

  lines.push('---', '', '_Findings are FIX-ATTEMPTED candidates for Bug Lord triage. Per R-015, nothing here closes a ticket — only Patrick does, on-device._', '');

  fs.writeFileSync(path.join(RUN_DIR, 'usability-report.md'), lines.join('\n'));
  fs.writeFileSync(path.join(RUN_DIR, 'findings.json'), JSON.stringify({ runs }, null, 2));
}

// ---------------------------------------------------------------------------

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set.');
    process.exit(1);
  }
  await adb('wait-for-device');

  const { personas } = JSON.parse(fs.readFileSync(path.join(__dirname, 'personas.json'), 'utf8'));
  const filter = process.env.PERSONAS?.split(',').map((s) => s.trim());
  const selected = filter ? personas.filter((p) => filter.includes(p.id)) : personas;
  if (selected.length === 0) {
    console.error(`No personas matched filter "${process.env.PERSONAS}".`);
    process.exit(1);
  }

  fs.mkdirSync(RUN_DIR, { recursive: true });
  const runs = [];
  for (const persona of selected) {
    for (const task of persona.tasks) {
      try {
        runs.push(await runTask(persona, task));
      } catch (err) {
        console.error(`Task ${persona.id}/${task.id} crashed:`, err);
        runs.push({
          persona: persona.id, personaName: persona.name, task: task.id, goal: task.goal,
          outcome: 'error', summary: `Harness error: ${err.message}`,
          actions: 0, interactions: 0, durationSec: 0, findings: [], actionLog: [],
        });
      }
    }
  }

  writeReport(runs);
  console.log(`\nReport: ${path.join(RUN_DIR, 'usability-report.md')}`);

  // Exit non-zero only for blockers — the report itself is the deliverable.
  const blockers = runs.flatMap((r) => r.findings).filter((f) => f.severity === 'blocker').length;
  const errors = runs.filter((r) => r.outcome === 'error').length;
  process.exit(blockers > 0 || errors > 0 ? 1 : 0);
}

main();
