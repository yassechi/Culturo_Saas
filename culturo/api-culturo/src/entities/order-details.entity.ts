import { Vegetable } from 'src/entities/vegetable.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity()
export class OrderDetail {
  @PrimaryGeneratedColumn()
  id_orderDetail: number;

  @Column()
  quantity: number;

  @Column()
  quantity_unit: string;

  @Column()
  unit_price: string;

  @ManyToOne(() => Vegetable, (vegetable) => vegetable.orderDetails)
  vegetable: Vegetable;

  @ManyToOne(() => Order, (order) => order.orderDetails)
  order: Order;
}
