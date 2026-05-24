<div align="center">
  <img src=".github/assets/banner.png" alt="apollo" style="width: 100%; max-width: 700px;"/>
  <p align="center">
    Simple scraper - economics news watcher
    <br />
    <a href="https://github.com/GabrielTenma/apollo/releases">Release</a>
    ·
    <a href="https://github.com/GabrielTenma/apollo/issues">Report Bug</a>
    ·
    <a href="https://github.com/GabrielTenma/apollo/issues">Request Feature</a>
  </p>
  <hr>
</div>

![Branches](https://www.shieldcn.dev/github/branches/GabrielTenma/apollo.svg?variant=secondary&size=xs)
![Last commit](https://www.shieldcn.dev/github/last-commit/GabrielTenma/apollo.svg?variant=secondary&size=xs)
![Release](https://www.shieldcn.dev/github/release/GabrielTenma/apollo.svg?variant=secondary&size=xs)
![CI](https://www.shieldcn.dev/github/ci/GabrielTenma/apollo.svg?variant=secondary&size=xs)
![License](https://www.shieldcn.dev/github/license/GabrielTenma/apollo.svg?variant=secondary&size=xs)
![Agent-friendly AGENTS.md](https://www.shieldcn.dev/badge/Agent--friendly-AGENTS.md-D97757.svg?variant=secondary&size=xs)

## Overview

Just a simple project focusing on scrape data related with economics for who need answer to take decision into market, processed with multiple sources data and openrouter LLM for describe the market tension, I called this `apollo`.

## How it works

Basically this app just collect data from trusted platform who updates related economic topic, wrap it up become one data and analyze with openrouter LLM autoselect `free` model, then send the result to social chat platform `telegram` for now.

For the future plan focusing integrate to stackyrd pkg which `diameter-tscd` project, frontend and manageable web-content.

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL database / Supabase
- [OpenRouter](https://openrouter.ai/) API key
- Telegram bot token (from [@BotFather](https://t.me/BotFather))

### Installation

```bash
# Clone the repository
git clone https://github.com/GabrielTenma/apollo.git
cd apollo

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and fill in your credentials
```

### Running

```bash
# Development (NestJS + Vite with hot reload)
npm run dev

# Production build
npm run build:all

# Start production server
npm run start:all
```

The app serves on `http://localhost:3000`. The Vite dev server runs on `http://localhost:3001`.

## Preview
![Web](.github/assets/preview.png)

For architecture details, see [DESIGN.md](DESIGN.md).

## License
Use Apache 2. See `LICENSE` for deal your free time.