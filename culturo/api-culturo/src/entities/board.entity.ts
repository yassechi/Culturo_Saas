import { SectionPlan } from './section_plan.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Sole } from './sole.entity';
import { Amended } from './amended.entity';
import { Treated } from './treated.entity';

@Entity()
export class Board {
  @PrimaryGeneratedColumn()
  id_board: number;

  @Column()
  board_name: string;

  @Column()
  board_width: number;

  @Column()
  board_length: number;

  @Column()
  board_active: boolean;

  @Column()
  id_sole: number;

  @ManyToOne(() => Sole, (sole) => sole.boards)
  @JoinColumn({ name: 'id_sole' })
  sole: Sole; // ⬅️ Nom de la propriété !

  @OneToMany(() => SectionPlan, (sectionPlan) => sectionPlan.board)
  sectionPlans: SectionPlan[];

  @OneToMany(() => Amended, (amended) => amended.board)
  amendeds: Amended[];

  @OneToMany(() => Treated, (treated) => treated.board)
  treateds: Treated[];
}
