import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_detail')
export class ProductDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id', unique: true })
  productId: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  specs: Record<string, any>;

  @Column({ name: 'ratings_avg', type: 'decimal', precision: 3, scale: 2, nullable: true })
  ratingsAvg: number;

  @Column({ name: 'reviews_count', default: 0 })
  reviewsCount: number;

  @Column({ length: 255, nullable: true })
  publisher: string;

  @Column({ name: 'publication_date', type: 'date', nullable: true })
  publicationDate: Date;

  @Column({ length: 20, nullable: true })
  isbn: string;

  @Column({ name: 'page_count', nullable: true })
  pageCount: number;

  @Column({ type: 'text', array: true, nullable: true })
  genres: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Product, (product) => product.detail)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}