# PlayBall

A real-time multiplayer football game built with Node.js, Express, and Socket.io.

## Features

- **Real-time multiplayer** — play with friends in the same room over the network
- **Physics engine** — custom ball & player physics with friction, collisions, and kick impulse
- **Multiple field sizes** — Small, Medium, and Large
- **Team themes** — choose from 13 club kits (Arsenal, Barcelona, Bayern, Chelsea, Dortmund, Inter, Juventus, Liverpool, Man City, Man Utd, AC Milan, PSG, Real Madrid)
- **Configurable settings** — adjust match duration and number of goals before starting
- **60 fps server tick** — authoritative server-side game loop for smooth, cheat-resistant gameplay

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Server | Node.js, Express |
| Real-time | Socket.io |
| Client | Vanilla JS, HTML5 Canvas |

## Getting Started

### Prerequisites

- Node.js 18+

### Installation

```bash
git clone https://github.com/DanielRazal/PlayBall.git
cd PlayBall
npm install
```

### Run

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser, then share the link with a friend on the same network.

## How to Play

| Key | Action |
|-----|--------|
| `W` / `↑` | Move up |
| `S` / `↓` | Move down |
| `A` / `←` | Move left |
| `D` / `→` | Move right |
| `Space` | Kick |

1. One player creates a room and sets match options.
2. Share the room code with teammates.
3. First team to reach the goal limit — or the team with more goals when time runs out — wins.

## Project Structure

```
PlayBall/
├── server.js         # Express + Socket.io server, authoritative game loop
├── index.html        # Game UI and lobby
├── style.css         # Styles
├── js/
│   ├── constants.js  # Shared physics & field constants
│   ├── game.js       # Game state management
│   ├── main.js       # Entry point, socket event handling
│   ├── network.js    # Client-server communication
│   ├── physics.js    # Collision & movement physics
│   ├── render.js     # Canvas rendering
│   ├── state.js      # Client state
│   └── themes.js     # Team kits & logos
└── logos/            # SVG/PNG club logos
```

## License

MIT
