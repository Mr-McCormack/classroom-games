# Game sources

The game pages in the main folder are built from these files. Edit here, then run:

    python3 src/build.py .

- `core.js` / `core.css`: setup screen, undo, autosave, team renaming (shared by every game)
- `buzz-teacher.js` + `firebase.js`: the buzz-in line on the game screen
- `buzz-student.html`: the student "Buzz In" page (built to `buzz.html`)
- one `.js` + `.css` pair per game, listed in `games.txt`

Buzz-in shares the Hall Pass Firebase project. `firestore.rules` (main folder) holds the rules for both.
