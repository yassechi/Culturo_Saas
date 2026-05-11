import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Amended } from './amended.entity';

@Entity()
export class Amendement {
  @PrimaryGeneratedColumn()
  id_amendement: number;

  @Column()
  amendment_name: string;

  @Column({ type: 'text', nullable: true })
  notice: string | null;

  @OneToMany(() => Amended, (amended) => amended.amendement)
  amendeds: Amended[];
}
