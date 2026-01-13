import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ScrapeJobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ScrapeJobType {
  NAVIGATION = 'navigation',
  CATEGORY = 'category',
  PRODUCT_LIST = 'product_list',
  PRODUCT_DETAIL = 'product_detail',
}

@Entity('scrape_job')
@Index(['status'])
@Index(['targetType'])
@Index(['startedAt'])
export class ScrapeJob {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'target_url', length: 500 })
  targetUrl: string;

  @Column({
    name: 'target_type',
    type: 'enum',
    enum: ScrapeJobType,
  })
  targetType: ScrapeJobType;

  @Column({
    type: 'enum',
    enum: ScrapeJobStatus,
    default: ScrapeJobStatus.PENDING,
  })
  status: ScrapeJobStatus;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'items_processed', default: 0 })
  itemsProcessed: number;

  @Column({ name: 'items_created', default: 0 })
  itemsCreated: number;

  @Column({ name: 'items_updated', default: 0 })
  itemsUpdated: number;

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}