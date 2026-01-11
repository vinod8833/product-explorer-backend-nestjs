import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Navigation } from './navigation.entity';
import { Product } from './product.entity';

@Entity('category')
@Index(['slug'], { unique: true })
@Index(['navigationId', 'parentId'])
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'navigation_id' })
  navigationId: number;

  @Column({ name: 'parent_id', nullable: true })
  parentId: number;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 255, unique: true })
  slug: string;

  @Column({ name: 'source_url', length: 500, nullable: true })
  sourceUrl: string;

  @Column({ name: 'product_count', default: 0 })
  productCount: number;

  @Column({ name: 'last_scraped_at', type: 'timestamp', nullable: true })
  lastScrapedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Navigation, (navigation) => navigation.categories)
  @JoinColumn({ name: 'navigation_id' })
  navigation: Navigation;

  @ManyToOne(() => Category, (category) => category.children)
  @JoinColumn({ name: 'parent_id' })
  parent: Category;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}