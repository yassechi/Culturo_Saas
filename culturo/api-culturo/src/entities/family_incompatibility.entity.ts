import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Family } from './family.entity';

@Entity('family_incompatibility')
@Unique(['family_a_id', 'family_b_id'])
export class FamilyIncompatibility {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Family, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'family_a_id' })
  family_a: Family;

  @Column()
  family_a_id: number;

  @ManyToOne(() => Family, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'family_b_id' })
  family_b: Family;

  @Column()
  family_b_id: number;

  @Column({ type: 'text', nullable: true })
  reason: string | null;
}
