import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exploitation } from './exploitation.entity';
import { Board } from './board.entity';

@Entity()
export class Sole {
  @PrimaryGeneratedColumn()
  id_sole: number;

  @Column()
  sole_name: string;

  @Column({ default: true })
  sole_active: boolean;

  @ManyToOne(() => Exploitation, (exploitation) => exploitation.soles)
  exploitation: Exploitation;

  @OneToMany(() => Board, (board) => board.sole)
  boards: Board[];
}
