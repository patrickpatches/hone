# Patrick's Daily Flow

> What to do when you log onto your computer. Read this first thing each session day.

This is the lived-experience layer. The COO operating system in `docs/coo/` is how the agents work; this doc is how *you* work with the agents.

---

## How the multi-chat thing actually works

You have one Cowork app on your computer. Inside it, you can run **separate chats**, and each chat is its own Claude — its own context window, its own memory of the conversation. They don't share what's said *in chat*, but they DO share files in this repo. So the way they coordinate is: they read the same files, and they leave each other notes (handoffs).

The roles you'll have running:
- **COO chat** (this one) — me. Sets direction, manages handoffs, writes weekly status.
- **Senior Engineer chat** — does code work. Renames bundle ID, ships features, fixes bugs.
- **Product Designer chat** — designs UI, writes mockups, owns the visual language.
- **Photography Director chat** — plans shoots, writes shot lists, reviews photos.
- **QA Test Lead chat** — tests builds, owns the smoke-test checklist.
- **Culinary Verifier chat** — audits recipes against the Golden Rules.
- **Accountant chat** — runs the books every Wednesday.

You don't run them all in parallel every day. You spin up the chat you need for what you're doing right now. When you're done, the work they did is in the files for the next chat to pick up.

---

## Tomorrow morning — your first hour

This is the priority order. Each step says what chat to be in, what to do, and roughly how long it takes.

### Step 1 (5 min) — Read the command centre

Open `docs/coo/command-centre.md` in any text editor. Read the top section. That's the state of the project in 60 seconds.

### Step 2 (5 min) — Answer COO's open decisions

You don't need a chat for this — just reply to me here, or open a new COO chat and reply. The decisions in `command-centre.md` under "Decisions awaiting Patrick" need answers:

1. **Confirm 24 July 2026 launch date** — yes / amend.
2. **Pick the 10 launch recipes.** Open the app, look at the 28 recipes, pick the 10 that show off the cooking-move spectrum (one braise, one fast sauté, one bake, one knife-heavy prep, one dessert, one weeknight pasta, two weekend dishes, one one-pot, one breakfast). Write them in `docs/launch-recipes.md` — just a numbered list of recipe names is fine.
3. **Recipes 11–28 question** in DECISION-003 — option 2 is my recommendation: ship them with hero shots only and a "Stage photos coming soon" badge. Tell me your call.

Once those answers are in, I update the launch plan and unblock the specialists.

### Step 3 (15 min) — Spin up the Senior Engineer chat to do the bundle ID rename

This is code work. You don't do this — the engineer agent does. Your job is just to start the chat and paste the starter prompt.

Open a new chat in Cowork. Name it "Hone — Senior Engineer." Paste in the starter prompt from `docs/coo/specialist-starter-prompts.md` (the Senior Engineer one). The agent will read CLAUDE.md, the file map, the handoffs, and start work.

The bundle ID rename specifically is one of the open handoffs. The agent will see it, do the rename in `mobile/app.json` and `mobile/package.json`, and confirm with you when done. **You don't need to find the bundle ID for me — I have it (it's `com.patricknasr.simmerfresh`, in the code, becoming `com.patricknasr.hone`).** What you'll do *after* the rename is upload the next AAB to Play Console, which will create the new app entry under the new package name. The engineer will tell you exactly what to click.

### Step 4 (15 min) — Spin up the Photography Director chat

Another new chat. Name it "Hone — Photography Director." Paste the photography starter prompt. The agent reads its brief and starts on the shot list.

It will be blocked until you've picked the 10 launch recipes (Step 2). So do Step 2 first.

### Step 5 (15 min) — Spin up the Culinary & Cultural Verifier chat

Same drill. New chat, named "Hone — Culinary Verifier," paste the culinary starter prompt. This agent will start the recipe audit. It can work in parallel with the photography one.

---

## After the first hour, on a typical session day

The pattern is the same:

1. Open the COO chat (this one), say what you want to focus on
2. I tell you which specialist needs to be in the loop
3. You open or return to that chat, paste the starter prompt if it's new, then say what you want done
4. The specialist does the work, updates the handoffs file
5. You come back to the COO chat at the end and I write the day's report

You don't need to remember any of this — the starter prompts make every chat self-orienting. They each read the same files at session start so they always know where things stand.

---

## What if you only have 30 minutes today

Open the COO chat. Read `command-centre.md`. Answer one of the open decisions, or pick one specialist task to push forward, or just review the state. Even small forward motion compounds. Don't let a busy day mean *nothing* happens.

---

## What if a chat goes off the rails

Sometimes a Claude chat will start doing something unexpected — going off scope, forgetting the rules, or taking too long on something trivial. When that happens:

- **First, push back in writing.** Tell the chat what's wrong: "you're doing X but per CLAUDE.md you should be doing Y." Most of the time that fixes it.
- **If it doesn't, end the chat and start a new one.** Context windows can get crowded; a fresh chat with the starter prompt re-grounds the agent.
- **If the same problem keeps happening, tell me (the COO).** I'll either update the brief, update CLAUDE.md, or escalate it as a process bug.

You are not stuck with any chat. They're disposable. The work is in the files, not the chat.

---

## Things only you can do

Per `docs/patrick-action-list.md`, certain things require you specifically. These are NOT delegated to any agent:

- Logging into Google Play Console and clicking buttons there
- Cooking and shooting the 60 stage photos
- Writing the Privacy Policy text (an agent can draft, but you publish)
- Confirming on-device that a bug fix actually works (we never self-close bugs — see CLAUDE.md Part 4)
- Inviting the 12+ closed testers and following up with them
- Approving the launch when it's time

Everything else is delegatable. If a specialist asks you to do something you think they could do themselves, push back and say "you do it" — the brief should make their lane clear.

---

## The weekly rhythm (what to expect every week)

- **Monday morning:** I (the COO) read everything new, queue the week's priorities, write to `command-centre.md`. You read the command centre and tell me what to push or change.
- **Wednesday:** Accountant chat updates the books. You don't need to do anything unless you have new receipts/invoices to share — just tell that chat and they'll file them.
- **Sunday evening:** I write a one-paragraph status. Read it on your phone before bed if you want, otherwise Monday morning.

Specialists work on their own cadence based on their handoffs. You don't drive them daily — you drive them when they're blocked or you want a status.
