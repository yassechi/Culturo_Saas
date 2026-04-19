import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User_ } from './user_.entity';
import { OrderDetail } from './order-details.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id_order: number;

  @Column({ type: 'date' })
  order_date: Date;

  @Column({ type: 'date' })
  order_delivery: Date;

  @ManyToOne(() => User_, (user_) => user_.orders)
  user_: User_;

  @OneToMany(() => OrderDetail, (detail) => detail.order)
  orderDetails: OrderDetail[];
}
