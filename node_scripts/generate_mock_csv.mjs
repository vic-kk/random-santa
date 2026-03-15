#!/usr/bin/env node

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import readline from 'node:readline';
import { setTimeout } from 'node:timers/promises';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSVPaths = path.resolve(__dirname, '../_local/SANTA.csv');

// 🎯 КЛАСС ДЛЯ ОТОБРАЖЕНИЯ ПРОГРЕССА
class TaskManager {
  constructor(tasks) {
    this.tasks = tasks.map((name, index) => ({
      name: name,
      status: '⏳ pending',
      details: '',
      index
    }));
    this.startTime = Date.now();
    this.render();
  }

  render() {
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);
    
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    console.log(`📄 ГЕНЕРАТОР ТЕСТОВЫХ ДАННЫХ | ⏱️  ${elapsed}с\n`);
    
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

// Функция для форматирования числа с разделителями
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Функция для генерации случайной даты в заданном диапазоне
function generateRandomDate() {
  const start = new Date(2025, 11, 1);
  const end = new Date(2025, 11, 31);
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  
  const options = {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  
  const dateStr = date.toLocaleString('en-US', options);
  return `${dateStr.replace(',', '')} GMT+7`;
}

// Функция для генерации случайного номера (6 цифр)
function generateRandomNumber(existingNumbers) {
  let number;
  do {
    number = Math.floor(100000 + Math.random() * 900000).toString();
  } while (existingNumbers.has(number));
  
  existingNumbers.add(number);
  return number;
}

// Функция для генерации случайного гендера
function generateRandomGender() {
  const genders = ['Дивчина', 'МУЖИК'];
  return genders[Math.floor(Math.random() * genders.length)];
}

// Функция для генерации случайного пожелания
function generateRandomWish() {
  const wishes = [
    '', '', '', '', '', '',
    'Нет пожеланий',
    'Как есть',
    'Любой подарок',
    'На ваше усмотрение',
    'Пожалуйста без сладкого 🚫🍬',
    'Люблю сладкое! 🍫',
    'Что-нибудь полезное 🥦',
    'Чай или кофе ☕',
    'Книгу 📚',
    'Для дома 🏠',
    'Средства для ухода 🧴',
    'Пожалуйста, без сладкого и соленого. Предпочту что-то полезное или для дома 🌿',
    'Обожаю сладости, особенно шоколад и печенье! Чем слаще, тем лучше 🍪😋',
    'Хотелось бы книгу или что-то для творчества. Ручная работа приветствуется 🎨',
    'Что-нибудь для уюта в доме: свечи, декор или комнатное растение 🕯️🌱',
    'Только натуральная косметика или средства для ухода за кожей, пожалуйста 🌸',
    'Сюрприз! Главное - внимание и забота 🥰💖',
    'Делайте как знаете, доверяю вашему вкусу! ✨🎁',
    'Что угодно, лишь бы не носки! 😄🧦❌',
    'Подарок от сердца - лучший подарок ❤️🤗',
    'Экологичные и локальные продукты поддержу 🌍🛒'
  ];
  return wishes[Math.floor(Math.random() * wishes.length)];
}

// Функция для генерации случайного адреса
function generateRandomAddress(city = null) {
  const cities = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Нижний Новгород', 'Челябинск', 'Самара', 'Омск', 'Ростов-на-Дону'];
  const streets = ['Ленина', 'Пушкина', 'Гагарина', 'Советская', 'Мира', 'Центральная', 'Молодежная', 'Школьная', 'Садовая', 'Набережная'];
  
  const selectedCity = city || cities[Math.floor(Math.random() * cities.length)];
  const street = streets[Math.floor(Math.random() * streets.length)];
  const building = Math.floor(Math.random() * 200) + 1;
  const corpus = Math.random() > 0.7 ? ` корпус ${Math.floor(Math.random() * 5) + 1}` : '';
  
  return `${selectedCity}, улица ${street} ${building}${corpus}`;
}

// Функция для генерации одной строки данных
function generateDataRow(index, existingNumbers) {
  const timestamp = generateRandomDate();
  const uniqueNumber = generateRandomNumber(existingNumbers);
  const gender = generateRandomGender();
  const wish = generateRandomWish();
  
  const city = Math.random() > 0.5 ? null : 'Москва';
  const ozonAddress = generateRandomAddress(city);
  
  let wbAddress;
  if (Math.random() > 0.8) {
    const newCity = city || (Math.random() > 0.5 ? 'Москва' : 'Санкт-Петербург');
    wbAddress = generateRandomAddress(newCity);
  } else {
    if (Math.random() > 0.5) {
      wbAddress = ozonAddress;
    } else {
      wbAddress = ozonAddress.replace(/корпус \d+/, `корпус ${Math.floor(Math.random() * 5) + 2}`) || ozonAddress;
    }
  }
  
  return [
    `"${timestamp}"`,
    `"${uniqueNumber}"`,
    `"${gender}"`,
    `"${wish}"`,
    `"${ozonAddress}"`,
    `"${wbAddress}"`
  ].join(',');
}

// Функция для проверки уникальности номеров
function validateUniqueNumbers(rows) {
  const numbers = new Set();
  const duplicates = [];
  
  for (let i = 1; i < rows.length; i++) {
    const columns = rows[i].split(',');
    const number = columns[1]?.replace(/"/g, '');
    
    if (numbers.has(number)) {
      duplicates.push(number);
    } else {
      numbers.add(number);
    }
  }
  
  return {
    isValid: duplicates.length === 0,
    duplicates,
    totalNumbers: numbers.size
  };
}

// Функция для создания CSV файла
async function createCSVFile(filename, rowCount, manager) {
  // Заголовки
  const headers = [
    '"Отметка времени"',
    '"Укажи уникальный номер, расположенный на сайте"',
    '"Укажи свой гендер"',
    '"Укажи свои пожелания, если хочешь. Что хотелось/не хотелось бы получить."',
    '"ОЗОН Адрес"',
    '"ВБ Адрес"'
  ].join(',');
  
  // Генерируем строки данных
  const rows = [headers];
  const existingNumbers = new Set();
  const batchSize = 1000; // Обновляем прогресс каждые 1000 записей
  
  for (let i = 0; i < rowCount; i++) {
    rows.push(generateDataRow(i, existingNumbers));
    
    // Обновляем прогресс каждые batchSize записей
    if ((i + 1) % batchSize === 0 || i === rowCount - 1) {
      const percent = Math.round(((i + 1) / rowCount) * 100);
      manager.updateDetails(1, `📊 ${formatNumber(i + 1)}/${formatNumber(rowCount)} (${percent}%)`);
    }
  }
  
  // Объединяем все строки
  const csvContent = rows.join('\n');
  
  // Записываем в файл
  writeFileSync(filename, csvContent, 'utf8');
  
  // Проверяем уникальность
  const validation = validateUniqueNumbers(rows);
  
  return {
    rowCount,
    uniqueCount: validation.totalNumbers,
    isValid: validation.isValid,
    sampleRows: rows.slice(0, 4)
  };
}

// Основная функция
async function main() {
  const args = process.argv.slice(2);
  let rowCount = 15;
  
  if (args.length > 0) {
    const count = parseInt(args[0]);
    if (!isNaN(count) && count > 0) {
      rowCount = count;
    }
  }
  
  // Создаем менеджер задач с выровненными этапами
  const manager = new TaskManager([
    '📁 Подготовка к генерации',
    '📊 Генерация данных',
    '✅ Проверка уникальности',
    '📝 Сохранение в файл',
    '🔍 Превью результатов'
  ]);

  try {
    // Шаг 1: Подготовка
    await manager.runTask(0, async () => {
      await setTimeout(500); // Небольшая задержка для визуализации
      return { 
        details: `🎯 Цель: ${formatNumber(rowCount)} записей`
      };
    });

    // Шаг 2: Генерация данных
    const result = await manager.runTask(1, async () => {
      const startTime = Date.now();
      const fileResult = await createCSVFile(CSVPaths, rowCount, manager);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      
      return { 
        ...fileResult,
        details: `⚡ ${duration}с`
      };
    });

    // Шаг 3: Проверка уникальности
    await manager.runTask(2, async () => {
      await setTimeout(300);
      return { 
        details: result.isValid 
          ? `✅ Все ${formatNumber(result.uniqueCount)} номеров уникальны` 
          : `❌ Найдены дубликаты!`
      };
    });

    // Шаг 4: Сохранение в файл
    await manager.runTask(3, async () => {
      await setTimeout(300);
      const fileSize = Math.round(JSON.stringify(result.sampleRows).length * result.rowCount / 1000);
      return { 
        details: `📁 ${path.basename(CSVPaths)}`
      };
    });

    // Шаг 5: Превью результатов
    await manager.runTask(4, async () => {
      let previewText = `\n📋 Первые 3 строки из ${formatNumber(result.rowCount)}:\n`;
      previewText += result.sampleRows.join('\n');
      
      return { details: previewText };
    });
  } catch (error) {
    console.error('\n❌ ОШИБКА:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

// Запуск
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}