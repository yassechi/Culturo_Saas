import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Vegetable } from './vegetable.entity';
import { Variety } from './variety.entity';
import { Exploitation } from './exploitation.entity';

@Entity()
export class PlantStock {
  @PrimaryGeneratedColumn()
  id_stock: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ default: 'plants' })
  unit: string; // 'plants' | 'graines' | 'kg'

  @Column({ type: 'date', nullable: true })
  received_date: Date | null;

  @Column({ nullable: true, type: 'varchar' })
  notes: string | null;

  @ManyToOne(() => Vegetable, { eager: false, nullable: false })
  vegetable: Vegetable;

  @ManyToOne(() => Variety, { eager: false, nullable: true })
  variety: Variety | null;

  @ManyToOne(() => Exploitation, { eager: false, nullable: true })
  exploitation: Exploitation | null;
}
