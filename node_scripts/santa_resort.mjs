#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'node:readline';
import { setTimeout } from 'node:timers/promises';
import { createWriteStream } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Пути к файлам
const PATHS = {
  csv: path.resolve(__dirname, '../_local/SANTA.csv'),
  parsed: path.resolve(__dirname, '../_local/parced/data.js'),
  addresses: path.resolve(__dirname, '../src/data/addresses.ts'),
  backupDir: path.resolve(__dirname, '../_local/backups'),
};

// 🔧 Утилиты для работы с файлами
const ensureDir = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

const createBackup = async (filePath) => {
  try {
    await fs.access(filePath);
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_');
    const backupName = `addresses_${timestamp}.ts`;
    const backupPath = path.join(PATHS.backupDir, backupName);
    
    await ensureDir(PATHS.backupDir);
    await fs.copyFile(filePath, backupPath);
    return { isGood: true, backupPath };
  } catch (error) {
    return { isGood: false };
  }
};

// 🎲 ПРОСТОЙ И НАДЁЖНЫЙ алгоритм жеребьёвки
const reSortNoShift = (input) => {
  const drawStartTime = performance.now();

  const ids = input.map(item => item.id);
  const n = ids.length;
  
  if (n < 2) {
    throw new Error('❌ Для жеребьёвки нужно минимум 2 участника');
  }
  
  // Создаём копию массива получателей
  let receivers = [...ids];
  let maxIterations = 1000; // Предотвращаем бесконечный цикл
  
  // Продолжаем перемешивать, пока не получим корректное распределение
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Перемешиваем массив получателей
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [receivers[i], receivers[j]] = [receivers[j], receivers[i]];
    }
    
    // Проверяем, что никто не дарит сам себе
    let valid = true;
    for (let i = 0; i < n; i++) {
      if (ids[i] === receivers[i]) {
        valid = false;
        break;
      }
    }
    
    if (valid) {
      // Нашли корректное распределение
      const drawDuration = performance.now() - drawStartTime;
      
      // Создаём Map соответствий
      const newIds = new Map();
      const newSort = new Array(n);
      
      for (let i = 0; i < n; i++) {
        const item = input[i];
        newSort[i] = {
          id_santa: receivers[i],
          wishes: item.wishes,
          ozon_address: item.ozon_address,
          gender: item.gender,
          wb_address: item.wb_address
        };
        newIds.set(item.id, receivers[i]);
      }
      
      return { 
        newSort, 
        newIds, 
        drawDuration, 
        corrections: iteration + 1,
        attempts: iteration + 1 
      };
    }
  }
  
  throw new Error(`❌ Не удалось найти корректное распределение за ${maxIterations} попыток`);
};

// 📊 Парсинг CSV файла без внешних зависимостей
const parseCSV = async () => {  
  const csvContent = await fs.readFile(PATHS.csv, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('❌ CSV файл пуст или содержит только заголовок');
  }
  
  // Парсим заголовок
  const headers = parseCSVLine(lines[0]);
  
  // Парсим данные с предвыделением памяти
  const pureAddresses = new Array(lines.length - 1);
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const record = {};
    
    // Сопоставляем значения с заголовками
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = values[j] || '';
    }
    
    pureAddresses[i - 1] = {
      id: record['Укажи уникальный номер, расположенный на сайте'],
      gender: record['Укажи свой гендер'],
      wishes: record['Укажи свои пожелания, если хочешь. Что хотелось/не хотелось бы получить.'] || '',
      ozon_address: record['ОЗОН Адрес'] || '',
      wb_address: record['ВБ Адрес'] || '',
      timestamp: record['Отметка времени']
    };
  }
  
  return pureAddresses;
};

// Вспомогательная функция для парсинга строки CSV
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

// 📝 ОПТИМИЗИРОВАННАЯ генерация parsed файла (БЕЗ data.find в цикле!)
const generateParsedFile = async (data, assignments) => {
  const filePath = PATHS.parsed;
  await ensureDir(path.dirname(filePath));
  
  const writeStream = createWriteStream(filePath, 'utf8');
  
  return new Promise((resolve, reject) => {
    writeStream.on('error', reject);
    
    writeStream.write('// 🎅 ДАННЫЕ ТАЙНОГО САНТЫ (RAW PARSED DATA)\n');
    writeStream.write('// Сгенерировано автоматически\n\n');
    
    // INIT_ADDRESSES
    writeStream.write('export const INIT_ADDRESSES = [\n');
    
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      writeStream.write(`  {\n`);
      writeStream.write(`    id: "${item.id}",\n`);
      writeStream.write(`    gender: "${item.gender}",\n`);
      writeStream.write(`    wishes: ${JSON.stringify(item.wishes)},\n`);
      writeStream.write(`    ozon_address: ${JSON.stringify(item.ozon_address)},\n`);
      writeStream.write(`    wb_address: ${JSON.stringify(item.wb_address)},\n`);
      writeStream.write(`    timestamp: "${item.timestamp}"\n`);
      writeStream.write(`  }${i < data.length - 1 ? ',' : ''}\n`);
    }
    
    writeStream.write('];\n\n');
    
    // 🔥 ОПТИМИЗАЦИЯ: Создаём Map для быстрого доступа к данным по ID
    const dataMap = new Map();
    for (const item of data) {
      dataMap.set(item.id, item);
    }
    
    // SANTA_ASSIGNMENTS
    writeStream.write('// 🎲 РЕЗУЛЬТАТЫ ЖЕРЕБЬЁВКИ (Кто → Кому)\n');
    writeStream.write('export const SANTA_ASSIGNMENTS = {\n');
    
    const entries = Array.from(assignments.entries());
    for (let i = 0; i < entries.length; i++) {
      const [santaId, gifteeId] = entries[i];
      const santaData = dataMap.get(santaId); // O(1) вместо O(n)
      
      writeStream.write(`  "${santaId}": { // ${santaData?.gender || 'unknown'}`);
      if (santaData?.wishes) {
        // Ограничиваем длину пожелания для производительности
        const wishPreview = santaData.wishes.length > 30 
          ? santaData.wishes.substring(0, 30) + '...' 
          : santaData.wishes;
        writeStream.write(` (${wishPreview})`);
      }
      writeStream.write(`\n`);
      writeStream.write(`    giftee: "${gifteeId}",\n`);
      writeStream.write(`  }${i < entries.length - 1 ? ',' : ''}\n`);
    }
    
    writeStream.write('};\n');
    writeStream.end();
    writeStream.on('finish', resolve);
  });
};

// 📝 Оптимизированная генерация финального файла
const generateAddressesFile = async (data, assignments, newSort) => {
  const filePath = PATHS.addresses;
  await ensureDir(path.dirname(filePath));
  
  const writeStream = createWriteStream(filePath, 'utf8');
  
  return new Promise((resolve, reject) => {
    writeStream.on('error', reject);
    
    writeStream.write('// 🎅 ДАННЫЕ ТАЙНОГО САНТЫ\n');
    writeStream.write('// Сгенерировано автоматически. НЕ РЕДАКТИРУЙТЕ ВРУЧНУЮ!\n\n');
    
    // Комментированный вывод (только первые 20 для примера)
    writeStream.write('// 🎲 РЕЗУЛЬТАТЫ ЖЕРЕБЬЁВКИ (Map<string, string>)\n');
    writeStream.write('// Формат: ID Санты → ID Получателя\n');
    writeStream.write('/*\n');
    
    const entries = Array.from(assignments.entries());
    const previewCount = Math.min(20, entries.length);
    
    // 🔥 Тоже используем Map для быстрого доступа
    const dataMap = new Map();
    for (const item of data) {
      dataMap.set(item.id, item);
    }
    
    for (let i = 0; i < previewCount; i++) {
      const [santaId, gifteeId] = entries[i];
      const santaData = dataMap.get(santaId);
      const gifteeData = dataMap.get(gifteeId);
      writeStream.write(`  ${santaId} → ${gifteeId} (${santaData?.gender} → ${gifteeData?.gender})\n`);
    }
    if (entries.length > 20) {
      writeStream.write(`  ... и ещё ${entries.length - 20} пар\n`);
    }
    writeStream.write('*/\n\n');
    
    // Интерфейсы
    writeStream.write('export type DeliveryDataKeys = "gender" | "wishes" | "ozon_address" | "wb_address";\n');
    writeStream.write('export type DeliveryDataValue = string;\n\n');
    writeStream.write('export type DeliveryData = Record<DeliveryDataKeys, DeliveryDataValue>\n\n');
    
    // Map
    writeStream.write('export const DELIVERY_DATA = new Map<string, DeliveryData>([\n');
    
    for (let i = 0; i < newSort.length; i++) {
      const item = newSort[i];
      writeStream.write(`  [ "${item.id_santa}", {\n`);
      writeStream.write(`    gender: "${item.gender}",\n`);
      writeStream.write(`    wishes: ${JSON.stringify(item.wishes)},\n`);
      writeStream.write(`    ozon_address: ${JSON.stringify(item.ozon_address)},\n`);
      writeStream.write(`    wb_address: ${JSON.stringify(item.wb_address)}\n`);
      writeStream.write(`  }]${i < newSort.length - 1 ? ',' : ''}\n`);
    }
    
    writeStream.write(']);\n');
    writeStream.end();
    writeStream.on('finish', resolve);
  });
};

// 🎯 КЛАСС ДЛЯ ОТОБРАЖЕНИЯ ПРОГРЕССА
class TaskManager {
  constructor(tasks) {
    this.tasks = tasks.map((name, index) => ({
      name,
      status: '⏳ pending',
      details: '',
      index
    }));
    this.startTime = Date.now();
  }

  render() {
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);
    
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(3);
    console.log(`🎅 ТАЙНЫЙ САНТА | ⏱️  ${elapsed}с\n`);
    
    this.tasks.forEach(task => {
      let statusText = task.status;
      let detailsText = task.details ? ` ${task.details}` : '';
      
      if (task.status === '✅ done') {
        statusText = '\x1b[32m✅ done\x1b[0m';
      } else if (task.status === '🔄 in process') {
        statusText = '\x1b[33m🔄 in process\x1b[0m';
      }
      
      console.log(`${task.name} ... ${statusText}${detailsText}`);
    });
  }

  async runTask(index, taskFn, details = '') {
    this.tasks[index].status = '🔄 in process';
    if (details) this.tasks[index].details = details;
    this.render();
    
    const result = await taskFn();
    
    this.tasks[index].status = '✅ done';
    this.tasks[index].details = result.details || '';
    this.render();
    
    return result;
  }

  updateDetails(index, details) {
    this.tasks[index].details = details;
    this.render();
  }
}

// 🚀 Основная функция
const main = async () => {
  const manager = new TaskManager([
    '📁 Резервное копирование',
    '📊 Чтение и парсинг CSV',
    '🎲 Жеребьёвка участников',
    '📄 Сохранение распарсенных данных',
    '📝 Генерация финального файла',
    '🔍 Превью результатов'
  ]);

  try {
    // Шаг 0: Бэкап
    await manager.runTask(0, async () => {
      const { isGood, backupPath } = await createBackup(PATHS.addresses);
      return { details: isGood ? `\n\t📁 ${backupPath}` : '\n\tℹ️  первый запуск' };
    });

    // Шаг 1: Чтение CSV
    const { parsedData } = await manager.runTask(1, async () => {
      const parsedData = await parseCSV();
      if (parsedData.length === 0) {
        throw new Error('❌ CSV файл пуст');
      }
      return { 
        parsedData: parsedData,
        details: `\n\t📦 ${parsedData.length} записей`
      };
    });
    
    
    // Шаг 2: Жеребьёвка
    const drawResult = await manager.runTask(2, async () => {
      const { newSort, newIds, drawDuration, attempts } = reSortNoShift(parsedData);
      return { 
        newSort, 
        newIds,
        details: `\n\t⚡ ${drawDuration.toFixed(2)} мс 🎲 попыток: ${attempts}`
      };
    });
    
    // Шаг 3: Сохранение распарсенных данных
    await manager.runTask(3, async () => {
      await generateParsedFile(parsedData, drawResult.newIds);
      return { details: `\n\t📁 ${PATHS.parsed}` };
    });
    
    // Шаг 4: Генерация финального файла
    await manager.runTask(4, async () => {
      await generateAddressesFile(parsedData, drawResult.newIds, drawResult.newSort);
      return { details: `\n\t📁 ${path.basename(PATHS.addresses)}` };
    });
    
    // Шаг 5: Превью результатов
    await manager.runTask(5, async () => {
      const previewCount = Math.min(3, parsedData.length);
      const sampleAssignments = Array.from(drawResult.newIds.entries()).slice(0, previewCount);
      let previewText = `\n\t🎁 Участников обработано: \x1b[32m${parsedData.length}\x1b[0m\n`;
      
      // 🔥 Используем Map и здесь для быстрого доступа
      const dataMap = new Map();
      for (const item of parsedData) {
        dataMap.set(item.id, item);
      }
      
      for (const [santaId, gifteeId] of sampleAssignments) {
        const santa = dataMap.get(santaId);
        const giftee = dataMap.get(gifteeId);
        previewText += `\t${santaId} → ${gifteeId} (${santa?.gender} → ${giftee?.gender})\n`;
      }
      
      if (drawResult.newIds.size > previewCount) {
        previewText += `\t... + ${drawResult.newIds.size - previewCount} пар`;
      }
      
      return { details: previewText };
    });
  } catch (error) {
    console.error('\n❌ ОШИБКА:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
};

// Запуск
main();