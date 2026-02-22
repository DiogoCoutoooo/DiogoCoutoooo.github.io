// scripts/sync-machines.js
// To run locally with a token: $env:GITHUB_TOKEN="your_token"; node scripts/sync-machines.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file manually if it exists (to avoid extra dependencies)
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GITHUB_TOKEN\s*=\s*(.*)/);
    if (match && match[1]) {
        process.env.GITHUB_TOKEN = match[1].trim();
    }
}

const REPO_OWNER = 'DiogoCoutoooo';
const REPO_NAME = 'Cybersec-Obsidian';
const BASE_PATH = 'Tought%20Process';
const OUTPUT_FILE = path.join(__dirname, '../src/data/machines.json');

function parseFrontmatter(text) {
    const match = text.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return {};
    const result = {};
    match[1].split('\n').forEach(line => {
        const idx = line.indexOf(':');
        if (idx === -1) return;
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        result[key] = value;
    });
    return result;
}

async function fetchFromGitHub(endpoint) {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${endpoint}`;
    const headers = {};
    
    // Use GITHUB_TOKEN if available (for GitHub Actions)
    if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
        if (res.status === 403) {
            console.error('Rate limit exceeded or forbidden. Status 403.');
        }
        throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }
    return res.json();
}

async function sync() {
    console.log('Starting sync with GitHub...');
    const folders = ['Easy', 'Medium', 'Hard', 'Insane'];
    const allMachines = [];

    for (const folder of folders) {
        try {
            console.log(`Fetching ${folder} machines...`);
            const files = await fetchFromGitHub(`${BASE_PATH}/${folder}`);
            const mdFiles = files.filter(f => f.name.endsWith('.md') && f.name !== 'README.md');

            for (const file of mdFiles) {
                console.log(`- Syncing ${file.name}...`);
                const contentRes = await fetch(file.download_url);
                const text = await contentRes.text();
                const fm = parseFrontmatter(text);

                const title = fm.name || file.name.replace('.md', '');
                const matrix = {
                    ENUM:   parseInt(fm.matrix_enum   || '50') * 10,
                    REAL:   parseInt(fm.matrix_real   || '50') * 10,
                    CVE:    parseInt(fm.matrix_cve    || '50') * 10,
                    CUSTOM: parseInt(fm.matrix_custom || '50') * 10,
                    CTF:    parseInt(fm.matrix_ctf    || '50') * 10,
                };

                allMachines.push({
                    id: title.toLowerCase(),
                    title,
                    os: fm.os || 'Linux',
                    difficulty: fm.difficulty || folder,
                    pwnedDate: fm.pwn_date || '2000-01-01',
                    avatar: `https://raw.githubusercontent.com/DiogoCoutoooo/Cybersec-Obsidian/main/Tought%20Process/!Media/!Logo_${title}.png`,
                    description: fm.summary || `Write-up and thought process for ${title}.`,
                    matrix,
                    folder: folder
                });
            }
        } catch (err) {
            console.warn(`Could not fetch folder ${folder}: ${err.message}`);
        }
    }

    // Sort by pwnedDate (newest first)
    allMachines.sort((a, b) => new Date(b.pwnedDate).getTime() - new Date(a.pwnedDate).getTime());

    // Write to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allMachines, null, 2));
    console.log(`Successfully synced ${allMachines.length} machines to ${OUTPUT_FILE}`);
}

sync().catch(console.error);
