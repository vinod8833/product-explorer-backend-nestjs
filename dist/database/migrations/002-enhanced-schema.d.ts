import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class EnhancedSchema1704067300000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
