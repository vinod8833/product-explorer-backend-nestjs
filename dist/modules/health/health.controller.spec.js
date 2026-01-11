"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const health_controller_1 = require("./health.controller");
describe('HealthController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [health_controller_1.HealthController],
        }).compile();
        controller = module.get(health_controller_1.HealthController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
    describe('getHealth', () => {
        it('should return health status', () => {
            const result = controller.getHealth();
            expect(result).toHaveProperty('status', 'ok');
            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('uptime');
            expect(result).toHaveProperty('environment');
        });
    });
    describe('getReadiness', () => {
        it('should return readiness status', () => {
            const result = controller.getReadiness();
            expect(result).toHaveProperty('status', 'ready');
            expect(result).toHaveProperty('timestamp');
        });
    });
});
//# sourceMappingURL=health.controller.spec.js.map