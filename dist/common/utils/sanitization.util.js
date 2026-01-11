"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SanitizationUtil = void 0;
const common_1 = require("@nestjs/common");
class SanitizationUtil {
    static sanitizeHtml(input) {
        if (!input)
            return input;
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }
    static sanitizeSql(input) {
        if (!input)
            return input;
        return input
            .replace(/'/g, "''")
            .replace(/;/g, '')
            .replace(/--/g, '')
            .replace(/\/\*/g, '')
            .replace(/\*\//g, '');
    }
    static sanitizeUrl(url) {
        if (!url)
            return url;
        try {
            const parsedUrl = new URL(url);
            if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
                throw new common_1.BadRequestException('Invalid URL protocol');
            }
            return parsedUrl.toString();
        }
        catch (error) {
            throw new common_1.BadRequestException('Invalid URL format');
        }
    }
    static sanitizeFilePath(path) {
        if (!path)
            return path;
        return path
            .replace(/\.\./g, '')
            .replace(/\\/g, '/')
            .replace(/\/+/g, '/')
            .replace(/^\//, '');
    }
    static generateSlug(input) {
        if (!input)
            return '';
        return input
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    static sanitizePrice(price) {
        if (price === null || price === undefined || price === '') {
            return null;
        }
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        if (isNaN(numPrice) || numPrice < 0 || numPrice > 999999.99) {
            throw new common_1.BadRequestException('Invalid price value');
        }
        return Math.round(numPrice * 100) / 100;
    }
    static sanitizeEmail(email) {
        if (!email)
            return email;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const sanitized = email.toLowerCase().trim();
        if (!emailRegex.test(sanitized)) {
            throw new common_1.BadRequestException('Invalid email format');
        }
        return sanitized;
    }
    static removeControlCharacters(input) {
        if (!input)
            return input;
        return input.replace(/[\x00-\x1F\x7F]/g, '');
    }
    static truncateString(input, maxLength) {
        if (!input || input.length <= maxLength)
            return input;
        return input.substring(0, maxLength - 3) + '...';
    }
}
exports.SanitizationUtil = SanitizationUtil;
//# sourceMappingURL=sanitization.util.js.map