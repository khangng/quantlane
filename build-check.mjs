import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
import {seedAccounts} from './lib/accounts.seed.js';
import {normalizeAccount} from './lib/registry.js';
import './netlify/functions/accounts.js';
import './netlify/functions/data.js';
import './netlify/functions/ingest.js';
seedAccounts.forEach(normalizeAccount);
const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new Script(match[1]);
new Script(readFileSync(new URL('./manage.js',import.meta.url),'utf8'));
new Script(readFileSync(new URL('./fund-rules.js',import.meta.url),'utf8'));
console.log('Quantlane 2.16.0: configuration and JavaScript checks passed. Netlify bundles Functions next.');

new Script(readFileSync(new URL('./dashboard-core.js',import.meta.url),'utf8'));
