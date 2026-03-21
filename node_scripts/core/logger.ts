// node_scripts/core/logger.ts

import readline from 'readline';

export type TaskStatus = 'pending' | 'in-process' | 'done' | 'error';

export interface Task {
  name: string;
  status: TaskStatus;
  details: string;
  index: number;
}

export class TaskManager {
  private tasks: Task[];
  private startTime: number;
  private isActive: boolean = true;

  constructor(taskNames: string[]) {
    this.tasks = taskNames.map((name, index) => ({
      name,
      status: 'pending',
      details: '',
      index
    }));
    this.startTime = Date.now();
    this.render();
  }

  private render(): void {
    if (!this.isActive) return;
    
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);

    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(3);
    console.log(`🎅 ТАЙНЫЙ САНТА | ⏱️  ${elapsed}с\n`);

    this.tasks.forEach(task => {
      const statusText = this.getStatusText(task.status);
      const detailsText = task.details ? ` ${task.details}` : '';
      console.log(`${task.name} ... ${statusText}${detailsText}`);
    });
  }

  private getStatusText(status: TaskStatus): string {
    switch(status) {
      case 'done': return '\x1b[32m✅ done\x1b[0m';
      case 'in-process': return '\x1b[33m🔄 in process\x1b[0m';
      case 'error': return '\x1b[31m❌ error\x1b[0m';
      default: return '⏳ pending';
    }
  }

  async runTask<T>(
    index: number, 
    taskFn: () => Promise<T>, 
    details: string = ''
  ): Promise<T> {
    this.tasks[index].status = 'in-process';
    if (details) this.tasks[index].details = details;
    this.render();

    try {
      const result = await taskFn();
      this.tasks[index].status = 'done';
      this.tasks[index].details = result && typeof result === 'object' && 'details' in result 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (result as any).details 
        : '';
      this.render();
      return result;
    } catch (error) {
      this.tasks[index].status = 'error';
      this.tasks[index].details = error instanceof Error ? error.message : 'Unknown error';
      this.render();
      throw error;
    }
  }

  updateDetails(index: number, details: string): void {
    this.tasks[index].details = details;
    this.render();
  }

  complete(): void {
    this.isActive = false;
    console.log('\n'); // просто перевод строки после завершения
  }
}

export const logger = {
  info: (message: string, ...args: unknown[]) => 
    console.log(`\x1b[36mℹ️  ${message}\x1b[0m`, ...args),
  
  success: (message: string, ...args: unknown[]) => 
    console.log(`\x1b[32m✅ ${message}\x1b[0m`, ...args),
  
  warn: (message: string, ...args: unknown[]) => 
    console.log(`\x1b[33m⚠️  ${message}\x1b[0m`, ...args),
  
  error: (message: string, ...args: unknown[]) => 
    console.log(`\x1b[31m❌ ${message}\x1b[0m`, ...args),
  
  title: (message: string) => 
    console.log(`\n\x1b[1m${message}\x1b[0m`),
};