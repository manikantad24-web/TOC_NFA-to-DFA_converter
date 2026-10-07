# Development Guide

## Project architecture

This is a static web application with three main files:

- `index.html` — page structure and UI controls
- `style.css` — visual design and responsive styling
- `app.js` — NFA/DFA algorithms, visualization, simulation, state management

Supporting documentation is stored in `docs/`.

## Running the project

No build step is required.

For local development, use:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Main algorithm functions

The implementation contains functions for:

- ε-closure calculation
- NFA move operation
- subset construction
- DFA minimization
- DFA simulation
- graph construction and Canvas rendering
- input validation
- import/export

The application uses browser `localStorage` for theme preference, recent automata, and the current NFA.

## Making changes

1. Edit the relevant HTML, CSS, or JavaScript file.
2. Refresh the browser.
3. Test a normal NFA and an ε-NFA.
4. Test an accepted and rejected input string.
5. Test minimization after conversion.
6. Check import/export if the data format was changed.

## Before committing

Check that:

- The page loads without console errors.
- NFA → DFA conversion produces the expected states.
- ε-transitions work correctly.
- DFA simulation accepts/rejects expected strings.
- Minimization does not change the accepted language.
- Import/export still works.
- No generated files, secrets, or local IDE files are committed.
