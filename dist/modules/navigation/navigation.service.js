"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavigationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const navigation_entity_1 = require("../../database/entities/navigation.entity");
let NavigationService = class NavigationService {
    constructor(navigationRepository) {
        this.navigationRepository = navigationRepository;
    }
    async findAll() {
        return this.navigationRepository.find({
            order: { title: 'ASC' },
        });
    }
    async findOne(id) {
        const navigation = await this.navigationRepository.findOne({
            where: { id },
            relations: ['categories'],
        });
        if (!navigation) {
            throw new common_1.NotFoundException(`Navigation with ID ${id} not found`);
        }
        return navigation;
    }
    async findBySlug(slug) {
        const navigation = await this.navigationRepository.findOne({
            where: { slug },
            relations: ['categories'],
        });
        if (!navigation) {
            throw new common_1.NotFoundException(`Navigation with slug ${slug} not found`);
        }
        return navigation;
    }
    async create(createNavigationDto) {
        const navigation = this.navigationRepository.create(createNavigationDto);
        return this.navigationRepository.save(navigation);
    }
    async update(id, updateNavigationDto) {
        const navigation = await this.findOne(id);
        Object.assign(navigation, updateNavigationDto);
        return this.navigationRepository.save(navigation);
    }
    async remove(id) {
        const navigation = await this.findOne(id);
        await this.navigationRepository.remove(navigation);
    }
    async upsertBySlug(slug, data) {
        const existing = await this.navigationRepository.findOne({ where: { slug } });
        if (existing) {
            Object.assign(existing, data, { lastScrapedAt: new Date() });
            return this.navigationRepository.save(existing);
        }
        const navigation = this.navigationRepository.create({
            ...data,
            slug,
            lastScrapedAt: new Date(),
        });
        return this.navigationRepository.save(navigation);
    }
};
exports.NavigationService = NavigationService;
exports.NavigationService = NavigationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(navigation_entity_1.Navigation)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], NavigationService);
//# sourceMappingURL=navigation.service.js.map