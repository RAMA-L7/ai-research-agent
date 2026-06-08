// ═══════════════════════════════════════════════════════════════
//  AI RESEARCH AGENT — v4 (with Real Web Search)
//  Run from inside Google Sheets → Extensions → Apps Script
// ═══════════════════════════════════════════════════════════════

const GEMINI_API_KEY   = 'your_gemini_api_key_here';
const SEARCH_API_KEY   = 'your_search_api_key_here';
const SEARCH_ENGINE_ID = 'your_search_engine_id_here';

// Sheet tab names
const TOPICS_SHEET  = 'Topics';
const RESULTS_SHEET = 'Results';


// ───────────────────────────────────────────────────────────────
// MAIN
// ───────────────────────────────────────────────────────────────

function runAgent() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  setupSheets(ss);
  autoAddAITopics(ss);

  const topics = getPendingTopics(ss);

  if (topics.length === 0) {
    Logger.log('✅ No pending topics');
    return;
  }

  Logger.log('🚀 Researching ' + topics.length + ' topics...');

  topics.forEach(({ row, topic }) => {
    Logger.log('🔍 ' + topic);
    try {
      const data = researchTopic(topic);
      saveResult(ss, topic, data);
      markTopicDone(ss, row);
      Logger.log('✅ Saved: ' + topic);
      Utilities.sleep(1000);
    } catch (e) {
      markTopicError(ss, row, e.message);
      Logger.log('❌ Error: ' + e.message);
    }
  });

  Logger.log('🎉 All done!');
}


// ───────────────────────────────────────────────────────────────
// AUTO-GENERATE fresh AI topics using Gemini
// ───────────────────────────────────────────────────────────────

function autoAddAITopics(ss) {
  Logger.log('🤖 Generating fresh AI topics...');

  const today = new Date().toDateString();

  const raw = callGemini(`
    You are an AI trend analyst. Generate 3 specific, interesting AI research topics for today (${today}).
    Focus on: AI agents, LLMs, AI tools, AI in hardware/chips, AI automation.
    Reply ONLY with 3 topics, one per line, no numbering, no extra text.
  `);

  const newTopics = raw.split('\n')
    .map(t => t.trim())
    .filter(t => t.length > 10)
    .slice(0, 3);

  const sheet    = ss.getSheetByName(TOPICS_SHEET);
  const existing = sheet.getDataRange().getValues()
    .map(r => r[0].toString().toLowerCase());

  let added = 0;
  newTopics.forEach(topic => {
    if (!existing.includes(topic.toLowerCase())) {
      sheet.appendRow([topic, 'Pending', new Date()]);
      added++;
    }
  });

  Logger.log('➕ Added ' + added + ' new topics');
}

function getPendingTopics(ss) {
  const sheet   = ss.getSheetByName(TOPICS_SHEET);
  const data    = sheet.getDataRange().getValues();
  const pending = [];

  for (let i = 1; i < data.length; i++) {
    const topic  = data[i][0];
    const status = data[i][1];
    if (topic && status === 'Pending') {
      pending.push({ row: i + 1, topic: topic.toString() });
    }
  }

  return pending;
}


// ───────────────────────────────────────────────────────────────
// RESEARCH a topic — web search + Gemini analysis
// ───────────────────────────────────────────────────────────────

function researchTopic(topic) {

  // Step 1 — Search the web for real articles
  Logger.log('  🌐 Searching web for: ' + topic);
  const searchResults = searchWeb(topic);

  // Step 2 — Build context from real search results
  let webContext = '';
  const sources  = [];

  searchResults.forEach((result, i) => {
    webContext += `\nSource ${i+1}: ${result.title}\n${result.snippet}\nURL: ${result.link}\n`;
    sources.push(result.title + ' — ' + result.link);
  });

  // Step 3 — Ask Gemini to analyze real web content
  Logger.log('  🤖 Analyzing with Gemini...');
  const raw = callGemini(`
    You are an expert research agent. Analyze this topic: "${topic}"
    
    Here are real web search results from today:
    ${webContext}
    
    Based on these real sources, provide a research report.
    Be concise. Reply ONLY in this exact format:
    
    CATEGORY: (one word: AI / Tech / Business / Science / Hardware)
    SUMMARY: (2 sentences based on the real sources above)
    KEY POINTS:
    - point 1
    - point 2
    - point 3
    LATEST DEVELOPMENTS: (1-2 sentences about what's happening now based on sources)
    VERDICT: (one sentence conclusion)
  `);

  return {
    category  : extractSection(raw, 'CATEGORY'),
    summary   : extractSection(raw, 'SUMMARY'),
    keyPoints : extractSection(raw, 'KEY POINTS'),
    latestDev : extractSection(raw, 'LATEST DEVELOPMENTS'),
    resources : sources.slice(0, 3).join('\n'),  // real URLs from search
    verdict   : extractSection(raw, 'VERDICT')
  };
}


// ───────────────────────────────────────────────────────────────
// WEB SEARCH — Google Custom Search API
// ───────────────────────────────────────────────────────────────

function searchWeb(query) {
  const url = 'https://www.googleapis.com/customsearch/v1'
    + '?key=' + SEARCH_API_KEY
    + '&cx='  + SEARCH_ENGINE_ID
    + '&q='   + encodeURIComponent(query)
    + '&num=5';  // get 5 results

  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  const data     = JSON.parse(response.getContentText());

  if (data.error) {
    Logger.log('Search error: ' + data.error.message);
    return [];
  }

  if (!data.items) {
    Logger.log('No results found for: ' + query);
    return [];
  }

  // Return title, snippet, and link for each result
  return data.items.map(item => ({
    title   : item.title,
    snippet : item.snippet,
    link    : item.link
  }));
}


// ───────────────────────────────────────────────────────────────
// SAVE result to Results sheet
// ───────────────────────────────────────────────────────────────

function saveResult(ss, topic, data) {
  const sheet = ss.getSheetByName(RESULTS_SHEET);
  sheet.appendRow([
    new Date(), topic,
    data.category, data.summary,
    data.keyPoints, data.latestDev,
    data.resources, data.verdict
  ]);
}


// ───────────────────────────────────────────────────────────────
// MARK topics
// ───────────────────────────────────────────────────────────────

function markTopicDone(ss, row) {
  ss.getSheetByName(TOPICS_SHEET).getRange(row, 2).setValue('Done ✅');
}

function markTopicError(ss, row, msg) {
  ss.getSheetByName(TOPICS_SHEET).getRange(row, 2).setValue('Error ❌: ' + msg);
}


// ───────────────────────────────────────────────────────────────
// SETUP sheets
// ───────────────────────────────────────────────────────────────

function setupSheets(ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!ss.getSheetByName(TOPICS_SHEET)) {
    const s = ss.insertSheet(TOPICS_SHEET);
    s.appendRow(['Topic', 'Status', 'Added On']);
    s.getRange(1, 1, 1, 3).setFontWeight('bold');
    s.setFrozenRows(1);
    Logger.log('✅ Created Topics sheet');
  }

  if (!ss.getSheetByName(RESULTS_SHEET)) {
    const s = ss.insertSheet(RESULTS_SHEET);
    s.appendRow(['Date', 'Topic', 'Category', 'Summary', 'Key Points', 'Latest Developments', 'Resources', 'Verdict']);
    s.getRange(1, 1, 1, 8).setFontWeight('bold');
    s.setFrozenRows(1);
    Logger.log('✅ Created Results sheet');
  }
}


// ───────────────────────────────────────────────────────────────
// WEEKLY EMAIL DIGEST
// ───────────────────────────────────────────────────────────────

function sendWeeklyDigest() {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const sheet   = ss.getSheetByName(RESULTS_SHEET);
  const email   = Session.getActiveUser().getEmail();

  const now       = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  const data     = sheet.getDataRange().getValues().slice(1);
  const thisWeek = data.filter(row => {
    const rowDate = row[0] instanceof Date ? row[0] : new Date(row[0]);
    return rowDate >= weekStart;
  });

  if (thisWeek.length === 0) {
    Logger.log('No research this week');
    return;
  }

  // Group by category
  const byCategory = {};
  thisWeek.forEach(row => {
    const category = row[2] || 'General';
    if (!byCategory[category]) byCategory[category] = [];
    byCategory[category].push({
      topic     : row[1],
      summary   : row[3],
      resources : row[6],
      verdict   : row[7]
    });
  });

  const weekStartStr = weekStart.toDateString();
  const weekEndStr   = now.toDateString();

  let body = `
═══════════════════════════════════════
  YOUR WEEKLY AI RESEARCH DIGEST
  ${weekStartStr} → ${weekEndStr}
═══════════════════════════════════════

Total topics researched: ${thisWeek.length}
`;

  Object.entries(byCategory).forEach(([category, items]) => {
    body += `\n━━━ ${category.toUpperCase()} (${items.length} topics) ━━━\n\n`;
    items.forEach((item, i) => {
      body += `${i + 1}. ${item.topic}\n`;
      body += `   Summary : ${item.summary}\n`;
      body += `   Verdict : ${item.verdict}\n`;
      body += `   Sources :\n`;
      item.resources.split('\n').forEach(r => {
        if (r.trim()) body += `     • ${r}\n`;
      });
      body += '\n';
    });
  });

  body += `
═══════════════════════════════════════
  Full research database:
  ${ss.getUrl()}
═══════════════════════════════════════
Keep building. 🚀
`;

  GmailApp.sendEmail(email,
    `🧠 Weekly AI Research Digest — ${weekStartStr} to ${weekEndStr}`,
    body, { name: 'AI Research Agent' }
  );

  Logger.log('📧 Weekly digest sent to ' + email);
}


// ───────────────────────────────────────────────────────────────
// UTILITIES
// ───────────────────────────────────────────────────────────────

function extractSection(text, sectionName) {
  const sections = ['CATEGORY', 'SUMMARY', 'KEY POINTS', 'LATEST DEVELOPMENTS', 'VERDICT'];
  const startMarker = sectionName + ':';
  const start = text.indexOf(startMarker);
  if (start === -1) return '';

  let end = text.length;
  sections.forEach(s => {
    if (s === sectionName) return;
    const idx = text.indexOf(s + ':', start + startMarker.length);
    if (idx !== -1 && idx < end) end = idx;
  });

  return text.substring(start + startMarker.length, end).trim();
}

function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  const response = UrlFetchApp.fetch(url, {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    muteHttpExceptions: true
  });

  const result = JSON.parse(response.getContentText());
  if (result.error.code === 429) {
  Logger.log('Rate limit hit — waiting 60 seconds...');
  Utilities.sleep(60000);
  return callGemini(prompt); // retry once
}
  return result.candidates[0].content.parts[0].text;
}


// ───────────────────────────────────────────────────────────────
// TRIGGERS — run each once
// ───────────────────────────────────────────────────────────────

function createTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'runAgent') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('runAgent')
    .timeBased().everyDays(1).atHour(8).create();
  Logger.log('✅ Daily trigger set — 8am every day');
}

function createWeeklyTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'sendWeeklyDigest') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sendWeeklyDigest')
    .timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(9).create();
  Logger.log('✅ Weekly trigger set — every Sunday 9am');
}