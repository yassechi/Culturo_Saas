import { Section } from './section.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Watering {
  @PrimaryGeneratedColumn()
  id_watering: number;

  @Column({ type: 'date' })
  watering_date: Date;

  @ManyToOne(() => Section, (section) => section.waterings)
  section: Section;
}
