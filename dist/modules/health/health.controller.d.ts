export declare class HealthController {
    getHealth(): {
        status: string;
        timestamp: string;
        uptime: number;
        environment: string;
    };
    getReadiness(): {
        status: string;
        timestamp: string;
    };
}
