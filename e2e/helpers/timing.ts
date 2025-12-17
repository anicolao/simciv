/**
 * Timing Instrumentation Helper for E2E Tests
 * 
 * This module provides detailed timing measurements for test operations
 * to identify bottlenecks and optimize test execution time.
 */

interface TimingEntry {
  label: string;
  duration: number;
  startTime: number;
  endTime: number;
}

class TestTimer {
  private entries: TimingEntry[] = [];
  private startTime: number;
  
  constructor() {
    this.startTime = performance.now();
  }
  
  /**
   * Measure the duration of an async operation
   */
  async measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const end = performance.now();
      this.entries.push({
        label,
        duration: end - start,
        startTime: start - this.startTime,
        endTime: end - this.startTime
      });
      return result;
    } catch (error) {
      const end = performance.now();
      this.entries.push({
        label: `${label} (ERROR)`,
        duration: end - start,
        startTime: start - this.startTime,
        endTime: end - this.startTime
      });
      throw error;
    }
  }
  
  /**
   * Measure the duration of a sync operation
   */
  measureSync<T>(label: string, fn: () => T): T {
    const start = performance.now();
    try {
      const result = fn();
      const end = performance.now();
      this.entries.push({
        label,
        duration: end - start,
        startTime: start - this.startTime,
        endTime: end - this.startTime
      });
      return result;
    } catch (error) {
      const end = performance.now();
      this.entries.push({
        label: `${label} (ERROR)`,
        duration: end - start,
        startTime: start - this.startTime,
        endTime: end - this.startTime
      });
      throw error;
    }
  }
  
  /**
   * Record a manual timing entry
   */
  record(label: string, duration: number) {
    const now = performance.now() - this.startTime;
    this.entries.push({
      label,
      duration,
      startTime: now - duration,
      endTime: now
    });
  }
  
  /**
   * Get the total time elapsed since the timer was created
   */
  getTotalTime(): number {
    return performance.now() - this.startTime;
  }
  
  /**
   * Generate a detailed timing report
   */
  generateReport(): string {
    const totalTime = this.getTotalTime();
    const accountedTime = this.entries.reduce((sum, e) => sum + e.duration, 0);
    const unaccountedTime = totalTime - accountedTime;
    
    const lines: string[] = [];
    lines.push('\n=== TIMING REPORT ===');
    lines.push(`Total Test Time: ${totalTime.toFixed(2)}ms`);
    lines.push(`Accounted Time: ${accountedTime.toFixed(2)}ms`);
    lines.push(`Unaccounted Time: ${unaccountedTime.toFixed(2)}ms (${(unaccountedTime / totalTime * 100).toFixed(1)}%)`);
    lines.push('\n--- Operations (in execution order) ---');
    
    // Sort by start time to show operations in execution order
    const sortedEntries = [...this.entries].sort((a, b) => a.startTime - b.startTime);
    
    for (const entry of sortedEntries) {
      const percentage = (entry.duration / totalTime * 100).toFixed(1);
      lines.push(`  ${entry.label.padEnd(50)} ${entry.duration.toFixed(2).padStart(8)}ms (${percentage.padStart(5)}%)`);
    }
    
    // Show top 10 slowest operations
    lines.push('\n--- Top 10 Slowest Operations ---');
    const topTen = [...this.entries]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
    
    for (let i = 0; i < topTen.length; i++) {
      const entry = topTen[i];
      const percentage = (entry.duration / totalTime * 100).toFixed(1);
      lines.push(`  ${(i + 1).toString().padStart(2)}. ${entry.label.padEnd(45)} ${entry.duration.toFixed(2).padStart(8)}ms (${percentage.padStart(5)}%)`);
    }
    
    // Breakdown by category
    lines.push('\n--- Category Breakdown ---');
    const categories: Map<string, number> = new Map();
    
    for (const entry of this.entries) {
      // Extract category from label (e.g., "Screenshot: 000-initial-load" -> "Screenshot")
      const category = entry.label.includes(':') 
        ? entry.label.split(':')[0].trim()
        : entry.label.split(' ')[0].trim();
      
      const current = categories.get(category) || 0;
      categories.set(category, current + entry.duration);
    }
    
    const sortedCategories = Array.from(categories.entries())
      .sort((a, b) => b[1] - a[1]);
    
    for (const [category, duration] of sortedCategories) {
      const percentage = (duration / totalTime * 100).toFixed(1);
      lines.push(`  ${category.padEnd(30)} ${duration.toFixed(2).padStart(10)}ms (${percentage.padStart(5)}%)`);
    }
    
    lines.push('===================\n');
    
    return lines.join('\n');
  }
  
  /**
   * Print the timing report to console
   */
  printReport() {
    console.log(this.generateReport());
  }
}

/**
 * Create a new test timer
 */
export function createTimer(): TestTimer {
  return new TestTimer();
}
