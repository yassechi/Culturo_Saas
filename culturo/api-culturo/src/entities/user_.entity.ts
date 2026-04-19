import { Exploitation } from './exploitation.entity';
import { CURRENT_TIMESTAMP } from 'src/utils/constants';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { Harvest } from './harvest.entity';
import { Order } from './order.entity';

@Entity()
export class User_ {
  @PrimaryGeneratedColumn()
  id_user: number;

  @Column({ type: 'varchar', length: '100' })
  user_first_name: string;

  @Column({ type: 'varchar', length: '100' })
  user_last_name: string;

  @Column({ type: 'date' })
  birth_date: Date;

  @Column({ type: 'varchar', length: '150', unique: true })
  email: string;

  @Column({ type: 'varchar' })
  hpassword: string;

  @Column({ type: 'varchar' })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  path_photo: string;

  @Column({ type: 'boolean', default: true })
  user_active: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => CURRENT_TIMESTAMP })
  created_at: Date;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => CURRENT_TIMESTAMP,
    onUpdate: CURRENT_TIMESTAMP,
  })
  updated_at: Date;

  @Column({ name: 'id_role', nullable: false })
  id_role: number;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'id_role' })
  role: Role;

  @OneToMany(() => Exploitation, (exploitation) => exploitation.user_)
  exploitations: Exploitation[];

  @ManyToOne(() => Harvest, (harvest) => harvest.user_)
  harvest: Harvest;

  @OneToMany(() => Order, (order) => order.user_)
  orders: Order[];
}
