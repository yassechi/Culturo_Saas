import { CURRENT_TIMESTAMP } from 'src/utils/constants';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Section } from './section.entity';
import { User_ } from './user_.entity';

export type ObservationReviewStatus =
  | 'pending'
  | 'approved'
  | 'changes_requested';

export type ObservationPlantStatus = 'bon' | 'moyen' | 'mauvais';

@Entity()
export class Observation {
  @PrimaryGeneratedColumn()
  id_observation: number;

  @Column({ type: 'date' })
  observation_date: Date;

  @Column({ type: 'varchar', length: 120, nullable: true })
  disease_observed: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  pest_observed: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  weather_conditions: string | null;

  @Column({ type: 'varchar', length: 24 })
  plant_status: ObservationPlantStatus;

  @Column({ type: 'text' })
  notes: string;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  review_status: ObservationReviewStatus;

  @Column({ type: 'text', nullable: true })
  review_notes: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewed_at: Date | null;

  @Column({ type: 'boolean', default: true })
  seen_by_author: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => CURRENT_TIMESTAMP })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ name: 'id_section' })
  id_section_fk: number;

  @Column({ name: 'id_author' })
  id_author_fk: number;

  @Column({ name: 'id_reviewer', nullable: true })
  id_reviewer_fk: number | null;

  @ManyToOne(() => Section, (section) => section.observations, {
    nullable: false,
  })
  @JoinColumn({ name: 'id_section' })
  section: Section;

  @ManyToOne(() => User_, (user) => user.observations, { nullable: false })
  @JoinColumn({ name: 'id_author' })
  author: User_;

  @ManyToOne(() => User_, (user) => user.reviewedObservations, {
    nullable: true,
  })
  @JoinColumn({ name: 'id_reviewer' })
  reviewer: User_ | null;
}
