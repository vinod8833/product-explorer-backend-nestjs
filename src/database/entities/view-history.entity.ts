import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('view_history')
@Index(['sessionId', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['itemType', 'createdAt'])
export class ViewHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'session_id', nullable: true })
  sessionId?: string;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @Column({ name: 'item_id' })
  itemId: string;

  @Column({ name: 'item_type' })
  itemType: 'product' | 'category' | 'search';

  @Column()
  title: string;

  @Column()
  url: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    author?: string;
    price?: number;
    imageUrl?: string;
    category?: string;
    searchQuery?: string;
    [key: string]: any;
  };

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}