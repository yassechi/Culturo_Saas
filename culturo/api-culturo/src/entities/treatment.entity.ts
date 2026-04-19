import { Treated } from './treated.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Treatment {
  @PrimaryGeneratedColumn()
  id_treatment: number;

  @Column()
  treatment_name: string;

  @OneToMany(() => Treated, (treated) => treated.treatment)
  treateds: Treated[];
}
