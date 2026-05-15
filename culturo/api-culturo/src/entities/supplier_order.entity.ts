import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Supplier } from './supplier.entity';
import { User_ } from './user_.entity';
import { SupplierOrderItem } from './supplier_order_item.entity';

@Entity()
export class SupplierOrder {
  @PrimaryGeneratedColumn()
  id_supplier_order: number;

  @Column({ default: 'draft' })
  status: string; // 'draft' | 'sent' | 'received' | 'cancelled'

  @Column({ type: 'date' })
  order_date: Date;

  @Column({ type: 'date', nullable: true })
  expected_date: Date | null;

  @Column({ nullable: true, type: 'varchar' })
  notes: string | null;

  @ManyToOne(() => Supplier, (supplier) => supplier.orders, { nullable: false })
  supplier: Supplier;

  @ManyToOne(() => User_, { nullable: false })
  user_: User_;

  @OneToMany(() => SupplierOrderItem, (item) => item.supplierOrder, { cascade: true })
  items: SupplierOrderItem[];
}
