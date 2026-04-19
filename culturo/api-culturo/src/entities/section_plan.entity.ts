import { Board } from './board.entity';
import { Section } from './section.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class SectionPlan {
  @PrimaryGeneratedColumn()
  id_section_plan: number;

  @Column({ type: 'date', default: new Date() })
  creation_date: Date;

  @Column()
  number_of_section: number;

  @Column()
  section_plan_active: boolean;

  @OneToMany(() => Section, (section) => section.sectionPlan)
  sections: Section[];

  @ManyToOne(() => Board, (board) => board.sectionPlans)
  @JoinColumn({ name: 'id_board' }) // Assurez-vous d'avoir une colonne 'id_board' dans votre table section_plan
  board: Board; // OK
}
