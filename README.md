# 🎓 Presentation Group Verification Bot

A production-ready Discord verification bot for university presentation groups built with **Node.js** and **Discord.js v14**.

New members **must verify** before gaining access to the server. Until verification they only see `#rules` and `#verify`.

---

## ✨ Features

| Feature | Description |
|---|---|
| **🔐 Verification Modal** | Collects full name, student ID (last 3 digits), and course code |
| **✅ Auto Role Assignment** | Assigns a "Verified" role plus a course-specific role (IBCC, CF, ENG, MATH101) |
| **🏷️ Auto Nickname** | Renames members to `Name | 123` format |
| **📝 Verification Logs** | Success and failure logs posted to `#verification-log` |
| **🛡️ Anti-Spam** | Blocks users after 5 failed attempts within 10 minutes |
| **🔄 Admin Reset** | `/reset` — removes verification so user can re-verify |
| **📊 Stats & Lookup** | `/verified` — total count & list; `/lookup` — search by student ID |
| **📁 CSV Export** | `/export` — downloads the full verified users database as a CSV |
| **🗄️ SQLite Database** | Auto-created, auto-migrated, injection-safe |

---

## 📁 Project Structure

```
PresentationBot/
├── index.js              # Main entry point — boots the bot
├── config.js             # Centralised config from .env
├── package.json          # Dependencies and scripts
├── .env                  # Your secrets (git-ignored)
├── .env.example          # Template for .env
├── README.md             # This file
│
├── commands/             # Slash command modules
│   ├── verifyPanel.js
│   ├── verified.js
│   ├── lookup.js
│   ├── reset.js
│   └── export.js
│
├── events/               # Discord event listeners
│   ├── ready.js
│   ├── guildMemberAdd.js
│   └── interactionCreate.js
│
├── handlers/             # Loaders that register events & commands
│   ├── eventHandler.js
│   └── commandHandler.js
│
├── database/             # SQLite database layer
│   └── database.js
│
├── buttons/              # Button interaction handlers
│   └── verifyButton.js
│
├── modals/               # Modal submission handlers
│   └── verificationModal.js
│
├── utils/                # Shared utilities
│   ├── logger.js
│   ├── embedBuilder.js
│   └── antiSpam.js
│
└── logs/                 # Daily log files (auto-created)
```

---

## 🚀 Installation

### Prerequisites

- **Node.js** v18+ (recommended: v20 or v22)
- A Discord account and a server where you have **Administrator** permissions
- A Discord Application created in the [Developer Portal](https://discord.com/developers/applications)

### 1. Clone or copy the project

```bash
cd PresentationBot
```

### 2. Install dependencies

```bash
npm install
```

This installs:
- `discord.js` ^14.18.0
- `better-sqlite3` ^11.7.0
- `dotenv` ^16.4.7

### 3. Configure environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then fill in every value (see **[Configuration](#configuration)** below).

---

## 🤖 How to Create the Bot & Get Your Token

1. Go to the **[Discord Developer Portal](https://discord.com/developers/applications)**
2. Click **New Application** → give it a name → **Create**
3. Go to the **Bot** tab in the left sidebar
4. Click **Reset Token** → copy the token → paste into `BOT_TOKEN` in `.env`
5. Under **Privileged Gateway Intents**, enable:
   - ✅ **Server Members Intent** (required for nickname & role management)
   - ✅ **Message Content Intent** (not strictly needed here, but enables future expansion)
6. Go to the **OAuth2 → URL Generator** tab

### 🔗 Invite the Bot to Your Server

In the OAuth2 URL Generator:

1. **Scopes**: check `bot` and `applications.commands`
2. **Bot Permissions**: check the following
   - `Send Messages`
   - `Embed Links`
   - `Manage Roles`
   - `Manage Nicknames`
   - `Read Message History`
   - `Use Slash Commands`
3. Copy the generated URL and open it in your browser
4. Select your server and click **Authorize**

### 📋 Required Permissions (Summary)

The bot needs these permissions to function:

| Permission | Why |
|---|---|
| **Manage Roles** | Assign/remove Verified & course roles |
| **Manage Nicknames** | Rename member to `Name | 123` |
| **Send Messages** | Post verification panel & logs |
| **Embed Links** | Display rich embed messages |
| **Read Message History** | Read button interactions |
| **Use Slash Commands** | Register and respond to `/` commands |

### 🧠 Required Intents

In the **Bot** tab of the Developer Portal, enable:

- **Server Members Intent** — so the bot sees new members and can manage their roles/nickname

---

## ⚙️ Configuration

### `.env` Variables

| Variable | Description |
|---|---|
| `BOT_TOKEN` | Your bot's secret token from the Developer Portal |
| `CLIENT_ID` | The Application ID (found in General Information) |
| `GUILD_ID` | Your server's ID (right-click server icon → Copy ID) |
| `VERIFIED_ROLE_ID` | Role ID for the "Verified" role |
| `IBCC_ROLE_ID` | Role ID for IBCC course |
| `CF_ROLE_ID` | Role ID for CF course |
| `ENG_ROLE_ID` | Role ID for ENG course |
| `MATH101_ROLE_ID` | Role ID for MATH101 course |
| `VERIFY_CHANNEL_ID` | Channel ID for `#verify` |
| `LOG_CHANNEL_ID` | Channel ID for `#verification-log` |

**How to get IDs:**
1. Enable **Developer Mode** in Discord: Settings → Advanced → Developer Mode
2. Right-click a server/channel/role → **Copy ID**

---

## 🏃 Running the Bot

```bash
npm start
```

Or with auto-restart on file changes:

```bash
npm run dev
```

On successful startup you'll see:

```
┌─────────────────────────────────────────────┐
│   ✅ Bot is online and ready!                │
├─────────────────────────────────────────────┤
│   Bot Name:     MyBot#1234                   │
│   Guild Count:  1                            │
│   Member Count: 150                          │
│   Ping:         42ms                         │
│   Database:     ✅ Connected                  │
└─────────────────────────────────────────────┘
```

---

## 📖 Usage

### Setting Up Verification

1. Use `/verify-panel` in any channel
2. The bot posts a beautiful embed with a **Verify** button in `#verify`
3. New members click **Verify** → fill in the modal → get roles & renamed

### Admin Commands

| Command | Description | Permission |
|---|---|---|
| `/verify-panel` | Posts the verification embed in `#verify` | Administrator |
| `/verified` | Shows total verified users (add `list:true` for full list) | Manage Roles |
| `/lookup studentid:` | Looks up a user by last 3 digits of their student ID | Manage Roles |
| `/reset user:` | Removes verification, roles, nickname — user can re-verify | Administrator |
| `/export` | Downloads all verified users as a CSV file | Administrator |

---

## 🛡️ Security

- **Never trust modal input** — every field is validated server-side
- **SQL injection safe** — all database queries use parameterised statements
- **Graceful role handling** — if a role is missing or permissions are insufficient, the bot logs a warning instead of crashing
- **Anti-spam** — rate-limits verification attempts (configurable in `config.js`)
- **Error catching** — every interaction handler has a try/catch; unhandled rejections are caught globally

---

## 📝 Logs

- Daily log files are written to the `logs/` directory (e.g. `logs/2025-07-15.log`)
- Verification success/failure events are also posted to `#verification-log`

---

## ❓ Troubleshooting

| Problem | Solution |
|---|---|
| "Missing required environment variables" | Fill in all values in `.env` |
| "Failed to register slash commands" | Check `CLIENT_ID` and `GUILD_ID` are correct |
| Roles not assigned | Verify the bot's role is **above** the roles it needs to assign in Server Settings → Roles |
| Nickname not set | The bot needs `Manage Nicknames` permission |
| "This interaction failed" | The bot is likely offline or crashed — check the terminal output |
| Database errors | Delete `database/verification.db` and restart — the table is auto-created |

---

## 🧪 Tech Stack

- **Runtime:** Node.js
- **Library:** Discord.js v14
- **Database:** SQLite via better-sqlite3
- **Config:** dotenv (`.env`)
- **Language:** JavaScript (no TypeScript)

---

## 📄 License

MIT — free to use, modify, and distribute.

---

Built with ❤️ for university presentation groups.
