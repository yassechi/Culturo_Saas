import { Family_importance } from './family_importance.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Vegetable } from './vegetable.entity';
// import { Legume } from './vegetable.entity';

@Entity()
export class Family {
  @PrimaryGeneratedColumn()
  id_family: number;

  @Column()
  family_name: string;

  @ManyToOne(
    () => Family_importance,
    (family_importance) => family_importance.id_family_importance,
  )
  family_importance: Family_importance;

  @OneToMany(() => Vegetable, (vegetable) => vegetable.family)
  vegetables: Vegetable[];
}
