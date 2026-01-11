import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Category } from './category.entity';
import { ProductDetail } from './product-detail.entity';
import { Review } from './review.entity';

@Entity('product')
@Index(['sourceId'], { unique: true })
@Index(['categoryId'])
@Index(['lastScrapedAt'])
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'source_id', length: 255, unique: true })
  sourceId: string;

  @Column({ name: 'category_id', nullable: true })
  categoryId: number;

  @Column({ length: 500 })
  title: string;

  @Column({ length: 255, nullable: true })
  author: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ length: 10, default: 'GBP' })
  currency: string;

  @Column({ name: 'image_url', length: 500, nullable: true })
  imageUrl: string;

  @Column({ name: 'source_url', length: 500 })
  sourceUrl: string;

  @Column({ name: 'in_stock', default: true })
  inStock: boolean;

  @Column({ name: 'last_scraped_at', type: 'timestamp', nullable: true })
  lastScrapedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToOne(() => ProductDetail, (detail) => detail.product)
  detail: ProductDetail;

  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];
}