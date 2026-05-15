import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SupplierOrder } from './supplier_order.entity';

@Entity()
export class Supplier {
  @PrimaryGeneratedColumn()
  id_supplier: number;

  @Column()
  supplier_name: string;

  @Column({ nullable: true, type: 'varchar' })
  contact_email: string | null;

  @Column({ nullable: true, type: 'varchar' })
  contact_phone: string | null;

  @Column({ nullable: true, type: 'varchar' })
  website: string | null;

  @Column({ default: true })
  supplier_active: boolean;

  @OneToMany(() => SupplierOrder, (order) => order.supplier)
  orders: SupplierOrder[];
}
