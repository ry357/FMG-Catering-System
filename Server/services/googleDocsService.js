import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { JWT } from 'google-auth-library';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from 'docx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = path.join(__dirname, '..', 'reports-output');

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';
const GOOGLE_DOC_MIME = 'application/vnd.google-apps.document';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

// Ensure newlines in the private key env var are preserved (\.\n escape is common on Vercel).
const normalizePrivateKey = (key) => (key || '').replace(/\\n/g, '\n');

export function getShareEmail() {
  return process.env.GOOGLE_DRIVE_SHARE_EMAIL || 'sasumanryan74@gmail.com';
}

const hasServiceAccountCreds = () =>
  Boolean(
    (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL) && process.env.GOOGLE_PRIVATE_KEY
  ) ||
  Boolean(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || 'null')?.client_email);

const hasOAuthCreds = () =>
  Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  );

// Which Google auth method is wired: 'oauth' (personal account) or 'service_account'.
export function getAuthMethod() {
  if (hasOAuthCreds()) return 'oauth';
  if (hasServiceAccountCreds()) return 'service_account';
  return null;
}

export function isGoogleDocsConfigured() {
  return Boolean(getAuthMethod());
}

function getDriveAuth() {
  let clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  const credentialsJson = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || 'null') || null;
  if (credentialsJson && credentialsJson.client_email && credentialsJson.private_key) {
    clientEmail = credentialsJson.client_email;
    privateKey = credentialsJson.private_key;
  }

  if (!clientEmail || !privateKey) {
    const error = new Error(
      'Google Docs API is not configured. Set up OAuth (GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET / GOOGLE_OAUTH_REFRESH_TOKEN) or a service account (GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY).'
    );
    error.code = 'GOOGLE_NOT_CONFIGURED';
    throw error;
  }

  return new JWT({
    email: clientEmail,
    key: normalizePrivateKey(privateKey),
    scopes: [DRIVE_SCOPE],
  });
}

// Exchanges the stored OAuth refresh token for a fresh access token.
async function getOAuthAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    const error = new Error(
      `Failed to refresh Google OAuth token (${res.status}): ${json.error_description || json.error || res.statusText}`
    );
    error.code = 'GOOGLE_OAUTH_FAILED';
    throw error;
  }
  return json.access_token;
}

async function getAccessToken() {
  if (getAuthMethod() === 'oauth') {
    return getOAuthAccessToken();
  }
  return (await getDriveAuth().getAccessToken()).token;
}

// Build the Google authorization URL for the one-time OAuth consent flow.
export function buildOAuthAuthUrl(redirectUri, state) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: DRIVE_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state: state || '',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Exchanges the one-time authorization code for access + refresh tokens.
export async function exchangeOAuthCode(code, redirectUri) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    const error = new Error(`Failed to exchange OAuth code (${res.status}): ${json.error_description || json.error || res.statusText}`);
    error.code = 'GOOGLE_OAUTH_FAILED';
    throw error;
  }
  return json;
}

// ── Markdown helpers ─────────────────────────────────────────────
const isSeparatorRow = (line) => /^\s*\|[\s\:-]+\|\s*$/.test(line);

const parseCells = (row) =>
  row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());

const parseRuns = (text, baseOpts = {}) => {
  const runs = [];
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true, ...baseOpts }));
    } else {
      runs.push(new TextRun({ text: part, ...baseOpts }));
    }
  }
  return runs.length ? runs : [new TextRun({ text: '', ...baseOpts })];
};

const TABLE_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 4, color: '666666' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: '666666' },
  left: { style: BorderStyle.SINGLE, size: 4, color: '666666' },
  right: { style: BorderStyle.SINGLE, size: 4, color: '666666' },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
  insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
};

const BODY_RUN = { font: 'Cambria', size: 22, color: '1C1C1C' };
const H1_RUN = { font: 'Cambria', size: 36, bold: true, color: '111111' };
const H2_RUN = { font: 'Cambria', size: 28, bold: true, color: '111111' };

function buildTable(rows) {
  const header = parseCells(rows[0]);
  const body = rows.filter((r) => !isSeparatorRow(r)).slice(1).map(parseCells);
  const cell = (content, bold) =>
    new TableCell({
      children: [new Paragraph({ children: parseRuns(content, { ...BODY_RUN, ...(bold ? { bold: true } : {}) }) })],
    });

  const headerRow = new TableRow({
    tableHeader: true,
    children: header.map((c) => cell(c, true)),
  });

  const bodyRows = body.map((cells) => new TableRow({ children: cells.map((c) => cell(c, false)) }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDERS,
    rows: [headerRow, ...bodyRows],
  });
}

// ── Document generation ──────────────────────────────────────────
// Uses only constructs verified to convert cleanly via the Google Drive
// importer (plain runs with explicit formatting, simple bordered tables,
// docx-native bullet numberings). Avoids styles.xml defaults, per-cell
// shading/margins/widths, and paragraph alignment/spacing that the
// importer rejects with a generic 400.
export function markdownToDocx(markdown) {
  const lines = String(markdown || '').split('\n');
  const children = [];
  let pipeRun = [];

  const flushPipeRun = () => {
    if (!pipeRun.length) return;
    if (pipeRun.some(isSeparatorRow)) {
      children.push(buildTable(pipeRun));
    } else {
      children.push(new Paragraph({ children: pipeRun.map(parseRuns).flat() }));
    }
    pipeRun = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('|')) {
      pipeRun.push(line);
      continue;
    }
    flushPipeRun();

    if (!line) continue;

    if (line.startsWith('# ')) {
      children.push(new Paragraph({ children: parseRuns(line.slice(2), H1_RUN) }));
    } else if (line.startsWith('## ')) {
      children.push(new Paragraph({ children: parseRuns(line.slice(3), H2_RUN) }));
    } else if (line.startsWith('- ')) {
      children.push(new Paragraph({ bullet: { level: 0 }, children: parseRuns(line.slice(2), BODY_RUN) }));
    } else if (line === '---') {
      children.push(
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '999999' } },
          children: [],
        })
      );
    } else if (line.startsWith('_') && line.endsWith('_')) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: line.slice(1, -1), italics: true, fontSize: 18, color: '666666' })],
        })
      );
    } else {
      children.push(new Paragraph({ children: parseRuns(line, BODY_RUN) }));
    }
  }
  flushPipeRun();

  return new Document({
    sections: [{ properties: {}, children }],
  });
}

export async function buildReportDocxBuffer(markdown) {
  return Packer.toBuffer(await markdownToDocx(markdown));
}

// ── Google Drive upload ──────────────────────────────────────────
async function createGoogleDoc({ name, docxBuffer, folderId, shareEmail }) {
  const token = await getAccessToken();

  const boundary = `fmg_drive_${Date.now()}`;
  const metadata = JSON.stringify({
    name,
    mimeType: GOOGLE_DOC_MIME,
    ...(folderId ? { parents: [folderId] } : {}),
  });

  const preamble = Buffer.from(
    `--${boundary}\r\n` +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      `${metadata}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${DOCX_MIME}\r\n` +
      'Content-Transfer-Encoding: binary\r\n\r\n',
    'utf8'
  );
  const postamble = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
  const multipartBody = Buffer.concat([preamble, docxBuffer, postamble]);

  const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  const uploadJson = await uploadRes.json().catch(() => ({}));
  if (!uploadRes.ok || !uploadJson.id) {
    const detail = uploadJson.error
      ? `${uploadJson.error.message || uploadRes.statusText} | ${JSON.stringify(uploadJson.error)}`
      : JSON.stringify(uploadJson) || uploadRes.statusText;
    const error = new Error(`Google Drive upload failed (${uploadRes.status}): ${detail}`);
    error.code = 'GOOGLE_UPLOAD_FAILED';
    error.responseData = uploadJson;
    throw error;
  }

  const fileId = uploadJson.id;

  if (shareEmail) {
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'writer', type: 'user', emailAddress: shareEmail }),
      });
    } catch {
      // The file may already belong to the sharing account (OAuth flow) — ignore.
    }
  }

  const metaRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,webViewLink`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const meta = await metaRes.json().catch(() => ({}));

  return { fileId, webViewLink: meta.webViewLink || `https://drive.google.com/file/d/${fileId}/view`, name: meta.name || name };
}

export async function uploadReportToGoogleDocs(report, markdown) {
  const buffer = await buildReportDocxBuffer(markdown);
  const date = String(report.report_date || '').slice(0, 10);
  const name = `FMG Monthly Summary Report${date ? ` ${date}` : ''}.docx`;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null;

  return createGoogleDoc({
    name,
    docxBuffer: buffer,
    folderId,
    shareEmail: getShareEmail(),
  });
}

// Uploads a report stored in the database, reading its markdown from disk.
export async function autoUploadMonthlyReport(report) {
  if (!isGoogleDocsConfigured()) return null;

  const markdown = await fs.readFile(path.join(REPORTS_DIR, path.basename(report.file_path)), 'utf8');
  return uploadReportToGoogleDocs(report, markdown);
}