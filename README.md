# 🤖 AI Research Agent

An autonomous AI research agent built with Google Apps Script, Gemini API, and Google Custom Search — runs completely free with zero infrastructure.

## What It Does

Every day at 8am, the agent wakes up automatically and:

1. **Generates 3 fresh AI topics** using Gemini
2. **Searches the web** for real articles on each topic
3. **Analyzes and summarizes** content using Gemini AI
4. **Saves structured reports** to Google Sheets
5. **Sends a weekly digest** email every Sunday

No servers. No hosting. No cost.

## Demo

| Topics Sheet | Results Sheet |
|-------------|---------------|
| Auto-generated daily | Structured research reports |
| Status tracking | Real web sources |
| Duplicate prevention | Category classification |

## Tech Stack

- **Google Apps Script** — automation engine
- **Gemini API** — AI research and analysis
- **Google Custom Search API** — real-time web search
- **Google Sheets** — structured database
- **Gmail** — weekly digest delivery

## Features

- ✅ Fully autonomous — runs without human intervention
- ✅ Real web search — not just AI training data
- ✅ Structured output — Category, Summary, Key Points, Sources, Verdict
- ✅ Duplicate prevention — never researches same topic twice
- ✅ Error handling — continues if one topic fails
- ✅ Weekly email digest — grouped by category
- ✅ 100% free — stays within all free tier limits

## Setup

### 1. Get API Keys (all free)

**Gemini API Key:**
- Go to [aistudio.google.com](https://aistudio.google.com)
- Click Get API Key → Create API Key

**Google Custom Search:**
- Go to [programmablesearchengine.google.com](https://programmablesearchengine.google.com)
- Create a new search engine
- Get your Search Engine ID
- Enable Custom Search API in Google Cloud Console
- Create an API key restricted to Custom Search API

### 2. Create Google Sheet

- Go to [sheets.google.com](https://sheets.google.com)
- Create a new blank sheet
- Name it `AI Research Agent`
- Click Extensions → Apps Script

### 3. Add the Code

- Delete everything in the editor
- Paste the contents of `research_agent.gs`
- Fill in your API keys at the top:

```javascript
const GEMINI_API_KEY   = 'your_gemini_api_key';
const SEARCH_API_KEY   = 'your_search_api_key';
const SEARCH_ENGINE_ID = 'your_search_engine_id';
```

### 4. Run Setup

Run these functions once in order:

```
1. setupSheets      → creates Topics and Results tabs
2. createTrigger    → sets daily 8am automation
3. createWeeklyTrigger → sets Sunday 9am email digest
4. runAgent         → test run immediately
```

## How It Works

```
Daily 8am trigger
      ↓
Gemini generates 3 fresh AI topics
      ↓
Topics saved to sheet with status "Pending"
      ↓
For each Pending topic:
  → Google Custom Search fetches 5 real articles
  → Gemini analyzes real content
  → Structured report saved to Results sheet
  → Topic marked "Done ✅"
      ↓
Every Sunday 9am:
  → Weekly digest email sent
  → Grouped by category
  → Real sources included
```

## Output Format

Each researched topic is saved with:

| Column | Description |
|--------|-------------|
| Date | When researched |
| Topic | Research topic |
| Category | AI / Tech / Hardware / Business / Science |
| Summary | 2-sentence overview from real sources |
| Key Points | 3 bullet points |
| Latest Developments | What's happening now |
| Resources | Real URLs from web search |
| Verdict | One-sentence conclusion |

## Rate Limits (Free Tier)

| API | Free Limit | Daily Usage |
|-----|-----------|-------------|
| Gemini API | 1500 req/day | ~6 requests |
| Custom Search | 100 searches/day | 3 searches |
| Apps Script | 6 min/execution | ~2 min |

## Project Structure

```
research_agent.gs       — main script
├── runAgent()          — main orchestrator
├── autoAddAITopics()   — generates daily topics
├── getPendingTopics()  — reads from sheet
├── researchTopic()     — web search + AI analysis
├── searchWeb()         — Google Custom Search
├── saveResult()        — writes to sheet
├── sendWeeklyDigest()  — Sunday email
├── setupSheets()       — creates sheet structure
├── createTrigger()     — daily 8am trigger
└── createWeeklyTrigger() — Sunday 9am trigger
```

## Author

**Rama Krishna Ketha**
- GitHub: [@RAMA-L7](https://github.com/RAMA-L7)
- LinkedIn: [Rama Krishna Ketha](https://linkedin.com/in/rama-krishna-ketha)

VLSI Design Engineer building AI automation tools.

## License

MIT — free to use, modify, and share.
