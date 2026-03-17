import fs from 'fs/promises';
import path from 'path';
import readline from 'readline/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FEATURES_PATH = path.resolve(__dirname, '../src/features/features.ts');
const STAGES = {
  '1': { name: '📝 Data collection', flags: { IN_SERVICE: false, SANTA_READY: false } },
  '2': { name: '🛠️  Service work', flags: { IN_SERVICE: true, SANTA_READY: false } },
  '3': { name: '🎁 Results', flags: { IN_SERVICE: false, SANTA_READY: true } },
};

async function getCurrentFlags() {
  try {
    const content = await fs.readFile(FEATURES_PATH, 'utf8');
    const inService = /IN_SERVICE:\s*(true|false)/.exec(content)?.[1] === 'true';
    const santaReady = /SANTA_READY:\s*(true|false)/.exec(content)?.[1] === 'true';
    return { IN_SERVICE: inService, SANTA_READY: santaReady };
  } catch {
    return { IN_SERVICE: false, SANTA_READY: false }; //fallback 
  }
}

function getStageName(flags) {
  if (flags.IN_SERVICE) return STAGES['1'].name;
  if (!flags.SANTA_READY) return  STAGES['2'].name;
  return STAGES['3'].name;
}

async function promptUser(rl, question) {
  return await rl.question(question);
}

async function updateFlags(flags) {
  const content = `export const FEATURES = { 
  /** 
   * Display a service message, hide the form and results 
   */ 
  IN_SERVICE: ${flags.IN_SERVICE}, 
  /** 
   * true - display the result, false - display the Google form 
   */ 
  SANTA_READY: ${flags.SANTA_READY},
}`;

  await fs.writeFile(FEATURES_PATH, content, 'utf8');
  console.log(`✅ Flags updated: IN_SERVICE=${flags.IN_SERVICE}, SANTA_READY=${flags.SANTA_READY}`);
}

async function setStage() {
  // Проверяем аргументы командной строки
  const args = process.argv.slice(2);
  
  // Если передан аргумент (например, 3)
  if (args.length > 0) {
    const stageArg = args[0];
    const selected = STAGES[stageArg];
    
    if (!selected) {
      console.error(`❌ Wrong stage number: ${stageArg}. Use 1, 2, or 3`);
      process.exit(1);
    }
    
    const { flags, name } = selected;
    await updateFlags(flags);
    console.log(`📌 Switched to: ${name}`);
    process.exit(0);
  }
  
  // Если аргументов нет — интерактивный режим
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const current = await getCurrentFlags();
    console.log(`🎅 Current stage: ${getStageName(current)}\n`);

    console.log('Select stage:');
    Object.entries(STAGES).forEach(([key, { name }]) => {
      console.log(`${key}) ${name}`);
    });

    const answer = await promptUser(rl, '\n> ');

    const selected = STAGES[answer];
    if (!selected) {
      console.log('❌ Wrong choice');
      process.exit(1);
    }

    const { flags, name } = selected;
    await updateFlags(flags);
    console.log(`📌 Switched to: ${name}`);
  } finally {
    rl.close();
  }
}

// Launch
setStage().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});