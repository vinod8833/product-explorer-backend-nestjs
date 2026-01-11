import { BadRequestException } from '@nestjs/common';

export class SanitizationUtil {
  static sanitizeHtml(input: string): string {
    if (!input) return input;
    
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  static sanitizeSql(input: string): string {
    if (!input) return input;
    
    return input
      .replace(/'/g, "''")
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '');
  }


  static sanitizeUrl(url: string): string {
    if (!url) return url;
    
    try {
      const parsedUrl = new URL(url);
      
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new BadRequestException('Invalid URL protocol');
      }
      
      return parsedUrl.toString();
    } catch (error) {
      throw new BadRequestException('Invalid URL format');
    }
  }

  static sanitizeFilePath(path: string): string {
    if (!path) return path;
    
    return path
      .replace(/\.\./g, '')
      .replace(/\\/g, '/')
      .replace(/\/+/g, '/')
      .replace(/^\//, '');
  }

  static generateSlug(input: string): string {
    if (!input) return '';
    
    return input
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') 
      .replace(/[\s_-]+/g, '-') 
      .replace(/^-+|-+$/g, ''); 
  }

  
  static sanitizePrice(price: any): number | null {
    if (price === null || price === undefined || price === '') {
      return null;
    }
    
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    if (isNaN(numPrice) || numPrice < 0 || numPrice > 999999.99) {
      throw new BadRequestException('Invalid price value');
    }
    
    return Math.round(numPrice * 100) / 100; 
  }


  static sanitizeEmail(email: string): string {
    if (!email) return email;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitized = email.toLowerCase().trim();
    
    if (!emailRegex.test(sanitized)) {
      throw new BadRequestException('Invalid email format');
    }
    
    return sanitized;
  }

  static removeControlCharacters(input: string): string {
    if (!input) return input;
    
    return input.replace(/[\x00-\x1F\x7F]/g, '');
  }

  static truncateString(input: string, maxLength: number): string {
    if (!input || input.length <= maxLength) return input;
    
    return input.substring(0, maxLength - 3) + '...';
  }
}