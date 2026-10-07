# Usage Guide: NFA → DFA Converter

A step-by-step guide to using the NFA → DFA Converter tool.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Defining an NFA](#defining-an-nfa)
3. [Building the Transition Table](#building-the-transition-table)
4. [Converting NFA to DFA](#converting-nfa-to-dfa)
5. [Simulating Strings](#simulating-strings)
6. [Minimizing DFA](#minimizing-dfa)
7. [Exporting and Importing](#exporting-and-importing)
8. [Tips and Tricks](#tips-and-tricks)

---

## Getting Started

### Opening the Tool

Open `index.html` in any modern web browser:

```bash
# Option 1: Direct file
open index.html

# Option 2: HTTP server (Python)
python -m http.server 8000
# Then visit http://localhost:8000/index.html

# Option 3: HTTP server (Node.js)
npx serve
# Then visit the displayed URL
```

### User Interface Overview

The tool is divided into three main panels:

- **Left Panel**: NFA definition (states, alphabet, transitions)
- **Center Canvas**: Graph visualization (NFA/DFA/Minimized DFA)
- **Right Panel**: Logs, simulation, complexity stats, minimization

---

## Defining an NFA

### Step 1: Enter States

In the **States & Alphabet** section:

1. Click the **States** input field
2. Enter state names separated by commas
3. Use alphanumeric names (e.g., `q0`, `q1`, `state_A`, `s0`)

**Example:**
```
q0,q1,q2,q3
```

**Rules:**
- State names must be unique
- Use only letters, digits, and underscores
- No spaces in names

### Step 2: Define the Alphabet

1. Click the **Alphabet** input field
2. Enter symbols separated by commas
3. Use single characters: `a`, `b`, `0`, `1`, etc.
4. For epsilon transitions, use `ε`

**Example:**
```
a,b,ε
```

**Notes:**
- Each symbol must be a single character (except ε)
- ε represents "epsilon" (empty string transition)
- Epsilon is optional; only include if your NFA has ε-transitions

### Step 3: Set Start State

1. Click the **Start State** input field
2. Enter one state name from your states list

**Example:**
```
q0
```

**Notes:**
- Must be one of the defined states
- Only one start state allowed
- Required field

### Step 4: Define Final States

1. Click the **Final States** input field
2. Enter final/accepting state names separated by commas

**Example:**
```
q2,q3
```

**Notes:**
- Must be from the defined states
- Can have multiple final states
- At least one final state required

---

## Building the Transition Table

### Click "Build Transition Table"

After defining states, alphabet, start, and finals:

1. Click the **"Build Transition Table"** button
2. The transition table appears below
3. The NFA graph is drawn on the canvas

### Filling in Transitions

The transition table shows:
- **Rows**: Each state
- **Columns**: Each alphabet symbol
- **Cells**: Target states (comma-separated)

**How to fill:**

1. Click on a cell
2. Enter target state names separated by commas
3. For no transition, leave blank or enter `∅` or `{}`
4. Press Enter or click elsewhere to save

**Example:**
- Cell [q0, a]: Enter `q0,q1` (can go to both q0 and q1)
- Cell [q1, ε]: Enter `q2` (epsilon transition to q2)
- Cell [q2, a]: Leave empty (no transition)

**Valid formats:**
- Empty or `∅` or `{}` → no transition
- `q1` → single target
- `q0,q1,q2` → multiple targets
- State names must exist

### Features

- **✓ Validation**: Red outline = invalid state name
- **✓ ε-Closure Preview**: Below the table, see ε-closure for each state
- **✓ Live Graph**: Canvas updates as you edit

---

## Converting NFA to DFA

### Automatic Conversion

For a full, automatic conversion:

1. Click the **"▶ Convert"** button
2. The conversion runs all steps at once
3. View the resulting DFA in the **DFA Graph** tab
4. Check the DFA transition table at the bottom

### Step-by-Step Conversion

To see each step of the algorithm:

1. Click **"▶ Convert"** to initialize
2. Click **"⏭ Step"** repeatedly to advance one step at a time
3. Watch the log on the right panel
4. Canvas highlights the current state being processed

### Automatic Playback

For animated step-by-step:

1. Click **"▶ Convert"** to initialize
2. Click **"⚡ Auto"** to start automatic playback
3. Adjust **Speed** slider to make it slower/faster
4. Click **"⏸ Pause"** to pause
5. Click **"⏭ Step"** to advance one step while paused

### Understanding the Steps

**Step Types in Log:**

| Tag | Meaning |
|-----|---------|
| INIT | Initial ε-closure of start state |
| MOVE | Computing `move(states, symbol)` |
| ε-CLOSURE | Computing ε-closure of moved states |
| NEW | New DFA state discovered |
| EXISTS | DFA state already exists (no action) |
| FINAL | Mark state as final (contains NFA final state) |
| DEAD | No transition (dead state) |

### Output

After conversion:
- **DFA States**: View in the **Complexity & Statistics** tab
- **DFA Table**: At the bottom of canvas area
- **DFA Graph**: Switch to **DFA Graph** tab on canvas
- **Conversion Log**: Full details in **Log** tab (right panel)

---

## Simulating Strings

### Running a Simulation

1. Switch to the **Simulate** tab (right panel)
2. Enter an input string in the **Input String** field
3. Characters must be in the alphabet (excluding ε)
4. Click **"Run"** button

**Example:**
```
Input: abb
(for alphabet {a, b})
```

**For empty string:**
- Leave the input field empty
- This checks if the start state is a final state

### Watching Simulation

**Automatic**: After clicking Run, simulation runs automatically with pauses between steps

**Manual steps**:
- Click **"⏭ Step"** to advance one character at a time
- Click **"↺ Reset"** to restart

### Understanding Results

**Accept (Green)**:
- String ends in a final state
- Shows: "✓ ACCEPTED in state Dx"

**Reject (Red)**:
- No valid transition exists, OR
- String ends in non-final state
- Shows: "✗ REJECTED"

**Simulation Log**: Shows each state transition

---

## Minimizing DFA

### Running Minimization

1. First, convert NFA to DFA (see [Converting NFA to DFA](#converting-nfa-to-dfa))
2. Click the **"Minimize"** tab (right panel)
3. Click the **"▶ Minimize"** button

### Viewing Results

After minimization:
- **Summary cards**: DFA states → Min-DFA states → States removed
- **Min-DFA Table**: Transition table of minimal DFA
- **Partition Steps**: Shows each refinement iteration
- **Before/After**: Visual bar chart comparing state counts
- **Min-DFA Graph**: Switch to **Minimized DFA** tab on canvas

### Understanding Minimization

The partition refinement algorithm:
1. Splits states into (final, non-final)
2. Iteratively refines based on distinguishability
3. Merges equivalent states
4. Returns minimal DFA

See [Algorithm Guide](algorithm.md) for details.

---

## Exporting and Importing

### Exporting DFA

To save your DFA as JSON:

1. Click **"⬇ Export DFA"** (header)
2. A file `dfa_export.json` downloads
3. Contains both DFA and source NFA

**File format:**
```json
{
  "dfa": {
    "states": [...],
    "alphabet": [...],
    "start": "D0",
    "finals": [...],
    "transitions": {...},
    "stateNames": {...}
  },
  "source_nfa": {
    "states": [...],
    "alphabet": [...],
    ...
  }
}
```

### Importing NFA

To load a previously exported NFA:

1. Click **"⬆ Import NFA"** (header)
2. Select a JSON file from your computer
3. The NFA is loaded into all fields
4. Click "Build Transition Table" to visualize

**Compatible formats:**
- Files exported from this tool
- Any JSON with `states`, `alphabet`, `start`, `finals`, `transitions`

---

## Tips and Tricks

### Quick Start

Use the **Example** or **Random** buttons to quickly generate test NFAs:
- **Example**: Pre-defined NFA (accepts strings ending in "ab")
- **Random**: Random NFA with 2-4 states

### Understanding ε-Transitions

- **Without ε**: Each state can directly reach specific states
- **With ε**: States can be "linked" via epsilon transitions
- **ε-Closure**: The set of states reachable using only ε-transitions

**Example**:
- δ(q0, ε) = {q1}
- δ(q1, ε) = {q2}
- ε-closure({q0}) = {q0, q1, q2}

### Large Conversions

For NFAs with > 10 states:
- Subset construction may generate hundreds of DFA states
- This is **normal** (worst case: 2^n states)
- Minimization will reduce redundant states
- See **Complexity & Statistics** tab for actual vs. theoretical metrics

### Debugging Failed Simulations

If a string you expect to accept is rejected:
1. Check **ε-closure** display (left panel)
2. Verify transition table entries (no typos)
3. Manually trace through the DFA graph
4. Use Step-by-step simulation to see where it diverges

### Dark/Light Mode

Click the **Dark/Light toggle** (top-right) to switch themes:
- **Dark mode**: Easy on the eyes
- **Light mode**: Better for printing/screenshots

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid state name" error | Use only letters, digits, underscores. No spaces. |
| No transitions appear in table | Click "Build Transition Table" after editing states/alphabet. |
| DFA is huge (many states) | Normal for large NFAs. Use minimization. |
| Simulation doesn't match expected | Check ε-closure and transitions carefully. Trace manually. |
| Import fails | Ensure JSON file has required fields: `states`, `alphabet`, `start`, `finals`, `transitions`. |
| Canvas is blank | Make sure you've built the transition table and converted NFA. |

---

## Glossary

- **NFA**: Nondeterministic Finite Automaton (can have multiple transitions per input)
- **DFA**: Deterministic Finite Automaton (exactly one transition per input)
- **ε (Epsilon)**: Empty string; allows "free" state transitions
- **ε-Closure**: Set of states reachable via epsilon transitions only
- **Subset Construction**: Algorithm to convert NFA → DFA
- **Minimization**: Algorithm to reduce DFA states by merging equivalents
- **Final State**: Accepting state; string is accepted if ending here
- **Transition Function**: δ(state, symbol) → target state(s)

---

Happy automata learning! 🎓

