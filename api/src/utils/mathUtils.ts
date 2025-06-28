export class MathUtils {
  /**
   * Calculate age from birthdate string
   */
  static calculateAge(birthdate: string): number {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Clamp a number between min and max values
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Normalize a value to 0-1 range
   */
  static normalize(value: number, min: number, max: number): number {
    if (max === min) return 0;
    return this.clamp((value - min) / (max - min), 0, 1);
  }

  /**
   * Calculate weighted average
   */
  static weightedAverage(values: number[], weights: number[]): number {
    if (values.length !== weights.length) {
      throw new Error('Values and weights arrays must have the same length');
    }

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    if (totalWeight === 0) return 0;

    const weightedSum = values.reduce((sum, value, index) => sum + (value * weights[index]), 0);
    return weightedSum / totalWeight;
  }
} 