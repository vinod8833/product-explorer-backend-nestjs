export declare class SanitizationUtil {
    static sanitizeHtml(input: string): string;
    static sanitizeSql(input: string): string;
    static sanitizeUrl(url: string): string;
    static sanitizeFilePath(path: string): string;
    static generateSlug(input: string): string;
    static sanitizePrice(price: any): number | null;
    static sanitizeEmail(email: string): string;
    static removeControlCharacters(input: string): string;
    static truncateString(input: string, maxLength: number): string;
}
