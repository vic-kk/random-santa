#!/usr/bin/env node

/**
 * Скрипт для переключения этапов проекта
 * Запуск: node node_scripts/set-stage.ts [1|2|3]
 */

import fs from 'fs/promises';
import path from 'path';
import readline from 'readline/promises';
import { fileURLToPath } from 'url';

type StageNumber = '1' | '2' | '3';

interface FeatureFlags {
  IN_SERVICE: boolean;
  SANTA_READY: boolean;
}

interface Stage {
  name: string;
  flags: FeatureFlags;
}

// Константы с типизацией
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FEATURES_PATH = path.resolve(__dirname, '../src/features/features.ts');

const STAGES: Record<StageNumber, Stage> = {
  '1': { name: '📝 Data collection', flags: { IN_SERVICE: false, SANTA_READY: false } },
  '2': { name: '🛠️  Service work', flags: { IN_SERVICE: true, SANTA_READY: false } },
  '3': { name: '🎁 Results', flags: { IN_SERVICE: false, SANTA_READY: true } },
};

/**
 * Читает текущие флаги из файла features.ts
 * @returns 
 */
async function getCurrentFlags(): Promise<FeatureFlags> {
  try {
    const content = await fs.readFile(FEATURES_PATH, 'utf8');
    
    const inServiceMatch = /IN_SERVICE:\s*(true|false)/.exec(content);
    const santaReadyMatch = /SANTA_READY:\s*(true|false)/.exec(content);
    
    return {
      IN_SERVICE: inServiceMatch?.[1] === 'true',
      SANTA_READY: santaReadyMatch?.[1] === 'true'
    };
  } catch {
    // Если файл не найден — возвращаем значения по умолчанию
    return { IN_SERVICE: false, SANTA_READY: false };
  }
}

/**
 * Возвращает название этапа по флагам
 * @param flags 
 * @returns 
 */
function getStageName(flags: FeatureFlags): string {
  if (flags.IN_SERVICE) return STAGES['2'].name;
  if (!flags.SANTA_READY) return STAGES['1'].name;
  return STAGES['3'].name;
}

/**
 * Обновляет файл features.ts с новыми флагами
 * @param flags 
 */
async function updateFlags(flags: FeatureFlags): Promise<void> {
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
  
  console.log(`\n✅ Flags updated: IN_SERVICE: ${flags.IN_SERVICE}, SANTA_READY: ${flags.SANTA_READY}`);
}

/**
 * Проверяет, является ли аргумент допустимым номером этапа
 */
function isValidStageNumber(arg: string): arg is StageNumber {
  return arg === '1' || arg === '2' || arg === '3';
}

/**
 * Основная функция переключения этапа
 */
async function setStage(): Promise<void> {
  const args = process.argv.slice(2);
  
  // Прямой режим: npm run stage -- 1/2/3
  if (args.length === 1 && isValidStageNumber(args[0])) {
    const stageNumber = args[0];
    const selected = STAGES[stageNumber];
    
    await updateFlags(selected.flags);
    console.log(`📌 Switched to: ${selected.name}`);
    process.exit(0);
  }
  
  // Если есть аргументы, но не 1/2/3 — показываем ошибку
  if (args.length > 0) {
    console.error('❌ Usage: npm run stage -- [1|2|3]');
    console.error('   or: npm run stage (for interactive mode)');
    process.exit(1);
  }
  
  // Интерактивный режим (без аргументов)
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const current = await getCurrentFlags();
    console.log(`🎅 Current stage: ${getStageName(current)}\n`);

    console.log('Select stage:');
    console.log(`1) ${STAGES['1'].name}`);
    console.log(`2) ${STAGES['2'].name}`);
    console.log(`3) ${STAGES['3'].name}`);

    const answer = await rl.question('\n> ');

    if (!isValidStageNumber(answer)) {
      console.log('❌ Wrong choice. Use 1, 2, or 3');
      process.exit(1);
    }

    const { flags, name } = STAGES[answer];
    await updateFlags(flags);
    console.log(`📌 Switched to: ${name}`);
  } finally {
    rl.close();
  }
}

// Launch
setStage().catch((error: Error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});