# Robot Math — First Grade Practice

A **pure client-side** browser game for first graders to practice single-digit addition and subtraction. There are no winners or losers; each correct answer adds a part to a robot until the picture is complete.

## How to run

1. Open `index.html` in a modern browser (Chrome, Firefox, Edge, Safari), or  
2. Serve the folder with any static server (e.g. `npx serve .`) and open the URL.

No build step or server is required.

## How to play

- A math problem appears (e.g. `3 + 4 = ?` or `7 − 2 = ?`).
- Type the answer in the box and tap **Check** (or press Enter).
- **Correct:** A new part is added to the robot and a new problem appears.
- **Wrong:** The message “Try again! You can do it!” appears; the same problem stays so the child can try again.

After 10 correct answers, the robot is complete. The child can keep solving problems for more practice.

## Tech

- HTML, CSS, JavaScript only
- Responsive layout and large touch-friendly controls
- Fredoka font for a friendly, readable look
