import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Treatment } from './treatment.entity';
import { Board } from './board.entity';

@Entity()
export class Treated {
  @PrimaryGeneratedColumn()
  id_treated: number;

  @Column({ type: 'date' })
  treatment_date: Date;

  @Column()
  treatment_quantity: number;

  @Column()
  treatment_unit: string;

  @ManyToOne(() => Board, (board) => board.treateds)
  board: Board;

  @ManyToOne(() => Treatment, (treatment) => treatment.treateds)
  treatment: Treatment;
}
