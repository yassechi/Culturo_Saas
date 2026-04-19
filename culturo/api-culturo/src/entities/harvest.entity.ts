import { User_ } from 'src/entities/user_.entity';
import { Section } from './section.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Harvest {
  @PrimaryGeneratedColumn()
  id_harvest: number;

  @Column({ type: 'date' })
  harvest_date: Date;

  @Column()
  quantity: number;

  @Column()
  quantity_unit: string;

  @ManyToOne(() => User_, (user_) => user_.exploitations)
  user_: User_;

  @ManyToOne(() => Section, (section) => section.harvets)
  section: Section;
}
