# NFA → DFA Visualizer

An interactive browser-based tool for converting **Nondeterministic Finite Automata (NFA)** to **Deterministic Finite Automata (DFA)** using subset construction.

The project is designed as an educational visualizer: instead of only producing the final DFA, it shows the conversion process, transition tables, graphs, ε-closures, simulation steps, and DFA minimization.

## Features

- Define an NFA with states, alphabet, start state, final states, and transitions
- Support for **ε-transitions**
- Compute and preview **ε-closures**
- Convert NFA → DFA using **subset construction**
- Step through the conversion or run it automatically
- Visualize NFA, DFA, and minimized DFA graphs
- Generate and inspect the DFA transition table
- Simulate input strings on the generated DFA
- Minimize the DFA using partition refinement
- Import NFA data from JSON
- Export generated DFA data as JSON
- Example NFA and random NFA generation
- Conversion logs and complexity statistics
- Dark/light theme
- Keyboard shortcuts
- Recent automata saved locally in the browser

## Technology

- HTML5
- CSS3
- Vanilla JavaScript
- HTML5 Canvas
- Browser `localStorage`

No framework, backend, database, or npm installation is required.

## Run locally

### Option 1 — Open directly

Open `index.html` in a modern browser.

### Option 2 — Use a local HTTP server

Python:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Node.js users can also use any simple static HTTP server.

## How to use

1. Enter the NFA states and alphabet.
2. Enter the start state and final states.
3. Click **Build Transition Table**.
4. Fill in transitions. Use `ε` for epsilon transitions and `{}` for an empty transition.
5. Click **Convert** to perform subset construction.
6. Use **Step** or **Auto** to study the conversion process.
7. Open the **DFA Graph** or transition table to inspect the result.
8. Use **Simulate** to test strings.
9. Use **Minimize** to reduce equivalent DFA states.

## Example

A simple NFA can be defined as:

```text
States:     q0,q1,q2
Alphabet:   a,b
Start:      q0
Final:      q2
```

Transitions can then be entered in the generated transition table.

## Algorithm

### 1. ε-closure

The ε-closure of a state is the set of states reachable using zero or more ε-transitions.

### 2. Subset construction

Each DFA state represents a set of NFA states.

```text
DFA start state = ε-closure(NFA start state)
```

For each DFA state `S` and input symbol `a`:

```text
next = ε-closure(move(S, a))
```

New reachable sets become new DFA states. A DFA state is final if its set contains at least one NFA final state.

The number of DFA states can be as high as:

```text
2^n
```

where `n` is the number of NFA states.

### 3. DFA minimization

After conversion, equivalent DFA states are identified through partition refinement and merged to produce a smaller equivalent DFA.

See [`docs/algorithm.md`](docs/algorithm.md) for the detailed explanation.

## Project structure

```text
nfa-to-dfa-visualizer/
├── index.html
├── app.js
├── style.css
├── LICENSE
├── README.md
├── CONTRIBUTING.md
├── CHANGELOG.md
└── docs/
    ├── algorithm.md
    ├── usage-guide.md
    └── development.md
```

## Browser compatibility

Use a modern browser such as Chrome, Edge, Firefox, or Safari.

## GitHub Pages

This project is a static website, so it can be deployed directly with **GitHub Pages**.

Recommended GitHub Pages configuration:

```text
Settings → Pages → Deploy from a branch → main → / (root)
```

After deployment, `index.html` will be used as the project homepage.

## License

This project is licensed under the MIT License. See [`LICENSE`](LICENSE).

## Author

Developed as an educational project for studying automata theory and finite-state machine conversion.
