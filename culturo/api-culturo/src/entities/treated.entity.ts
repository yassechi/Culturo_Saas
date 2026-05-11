import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Treatment } from './treatment.entity';
import { Board } from './board.entity';

@Entity()
export class Treated {
  @PrimaryGeneratedColumn()
  id_treated: number;

  @Column({ type: 'date' })
  treatment_date: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  treatment_quantity: number | null;

  @Column({ type: 'varchar', nullable: true })
  treatment_unit: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ManyToOne(() => Board, (board) => board.treateds)
  board: Board;

  @ManyToOne(() => Treatment, (treatment) => treatment.treateds)
  treatment: Treatment;
}
