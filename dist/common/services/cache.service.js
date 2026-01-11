"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
let CacheService = class CacheService {
    constructor() {
        this.cache = new Map();
    }
    async get(key, options) {
        const cached = this.cache.get(key);
        if (cached && cached.expires > Date.now()) {
            return cached.value;
        }
        if (options?.fallback) {
            const value = await options.fallback();
            await this.set(key, value, { ttl: options.ttl, tags: options.tags });
            return value;
        }
        return null;
    }
    async set(key, value, options) {
        const ttl = options?.ttl || 300;
        const expires = Date.now() + (ttl * 1000);
        const tags = options?.tags || [];
        this.cache.set(key, { value, expires, tags });
    }
    async del(key) {
        this.cache.delete(key);
    }
    async invalidateByPattern(pattern) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        }
    }
    async invalidateByTag(tag) {
        for (const [key, cached] of this.cache.entries()) {
            if (cached.tags.includes(tag)) {
                this.cache.delete(key);
            }
        }
    }
    async clear() {
        this.cache.clear();
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = __decorate([
    (0, common_1.Injectable)()
], CacheService);
//# sourceMappingURL=cache.service.js.map