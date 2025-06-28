export class TimezoneUtils {
  /**
   * F_tz: Timezone overlap (waking hours)
   */
  static calculateTimezoneOverlap(viewerTz: string, candidateTz: string): number {
    try {
      const viewerOffset = this.getTimezoneOffsetHours(viewerTz);
      const candidateOffset = this.getTimezoneOffsetHours(candidateTz);
      
      const hourDiff = Math.abs(viewerOffset - candidateOffset);
      
      // Score based on timezone difference (closer = higher score)
      if (hourDiff === 0) return 1.0;     // Same timezone
      if (hourDiff <= 3) return 0.8;      // 1-3 hours difference
      if (hourDiff <= 6) return 0.6;      // 4-6 hours difference  
      if (hourDiff <= 9) return 0.3;      // 7-9 hours difference
      if (hourDiff <= 12) return 0.1;     // 10-12 hours difference
      return 0.05;                        // 12+ hours (opposite sides of world)
    } catch (error) {
      console.warn('Timezone calculation error:', error);
      return 0.5; // Default to neutral
    }
  }

  /**
   * Get timezone offset in hours (simplified mapping)
   * In production, use a proper timezone library like date-fns-tz or moment-timezone
   */
  private static getTimezoneOffsetHours(timezone: string): number {
    const offsets: { [key: string]: number } = {
      'UTC': 0,
      'Asia/Singapore': 8,
      'America/New_York': -5,
      'America/Los_Angeles': -8,
      'Europe/London': 0,
      'Europe/Paris': 1,
      'Asia/Tokyo': 9,
      'Australia/Sydney': 11,
      'America/Chicago': -6,
      'America/Denver': -7,
      'Asia/Kolkata': 5.5,
      'Asia/Shanghai': 8,
      'Europe/Berlin': 1,
      'Europe/Moscow': 3
    };
    
    return offsets[timezone] || 0;
  }
} 