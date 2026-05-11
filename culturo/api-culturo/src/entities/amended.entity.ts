import { Board } from 'src/entities/board.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Amendement } from './amendement.entity';

@Entity('amended')
export class Amended {
  @PrimaryGeneratedColumn()
  id_amended: number;

  @Column({ type: 'date' })
  amendment_date: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  quantity: number | null;

  @Column({ type: 'varchar', nullable: true })
  quantity_unit: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ManyToOne(() => Board, (board) => board.amendeds, { nullable: true })
  @JoinColumn({ name: 'id_board' })
  board: Board | null;

  @ManyToOne(() => Amendement, (amendement) => amendement.amendeds, { nullable: true })
  @JoinColumn({ name: 'amendement_id' })
  amendement: Amendement | null;
}
