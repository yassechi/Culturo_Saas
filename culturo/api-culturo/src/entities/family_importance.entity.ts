import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Family } from './family.entity';

@Entity()
export class Family_importance {
  @PrimaryGeneratedColumn()
  id_family_importance: number;

  @Column()
  importance_name: string;

  @OneToMany(() => Family, (family) => family.id_family)
  families: Family[];
}
