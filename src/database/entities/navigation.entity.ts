import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Category } from './category.entity';

@Entity('navigation')
@Index(['slug'], { unique: true })
export class Navigation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 255, unique: true })
  slug: string;

  @Column({ name: 'source_url', length: 500, nullable: true })
  sourceUrl: string;

  @Column({ name: 'last_scraped_at', type: 'timestamp', nullable: true })
  lastScrapedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Category, (category) => category.navigation)
  categories: Category[];
}