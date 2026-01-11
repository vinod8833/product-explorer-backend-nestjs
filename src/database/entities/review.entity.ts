import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('review')
@Index(['productId'])
@Index(['rating'])
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id' })
  productId: number;

  @Column({ length: 255, nullable: true })
  author: string;

  @Column({ type: 'smallint', nullable: true })
  rating: number;

  @Column({ type: 'text', nullable: true })
  text: string;

  @Column({ name: 'review_date', type: 'date', nullable: true })
  reviewDate: Date;

  @Column({ name: 'helpful_count', default: 0 })
  helpfulCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Product, (product) => product.reviews)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}