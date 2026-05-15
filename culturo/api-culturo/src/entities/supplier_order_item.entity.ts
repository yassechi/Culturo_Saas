import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Vegetable } from './vegetable.entity';
import { Variety } from './variety.entity';
import { SupplierOrder } from './supplier_order.entity';

@Entity()
export class SupplierOrderItem {
  @PrimaryGeneratedColumn()
  id_item: number;

  @Column({ type: 'int' })
  quantity_ordered: number;

  @Column({ type: 'int', default: 0 })
  quantity_received: number;

  @Column({ default: 'plants' })
  unit: string;

  @Column({ nullable: true, type: 'varchar' })
  unit_price: string | null;

  @ManyToOne(() => Vegetable, { nullable: false })
  vegetable: Vegetable;

  @ManyToOne(() => Variety, { nullable: true })
  variety: Variety | null;

  @ManyToOne(() => SupplierOrder, (order) => order.items, { onDelete: 'CASCADE' })
  supplierOrder: SupplierOrder;
}
