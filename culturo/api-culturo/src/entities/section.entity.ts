import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { SectionPlan } from './section_plan.entity';
import { Watering } from './watering.entity';
import { Harvest } from './harvest.entity';
import { Vegetable } from './vegetable.entity';
import { Variety } from './variety.entity';

@Entity()
export class Section {
    @PrimaryGeneratedColumn()
    id_section: number;

    @Column()
    section_number: number;

    @Column({ type: 'date' })
    start_date: Date;

    @Column()
    quantity_planted: number;

    @Column({ type: 'date' })
    end_date: Date;

    @Column()
    section_active: boolean;

    @Column()
    unity: string;

    // --- Colonnes explicites des clés étrangères (POUR LA STABILITÉ) ---
    // Ces colonnes doivent correspondre aux noms de colonne dans la DB.
    @Column({ name: 'id_vegetable' }) 
    id_vegetable_fk: number; 
    
    @Column({ name: 'id_variety', nullable: true }) 
    id_variety_fk: number | null; 

    // --- Relations ManyToOne ---

    // 1. Relation vers SectionPlan
    @ManyToOne(() => SectionPlan, (sectionPlan) => sectionPlan.sections)
    sectionPlan: SectionPlan;

    // 2. Relation vers Vegetable (utilise id_vegetable_fk)
    @ManyToOne(() => Vegetable, (vegetable) => vegetable.sections, { nullable: true })
    @JoinColumn({ name: 'id_vegetable' })
    vegetable?: Vegetable; 

    // 3. Relation vers Variety (utilise id_variety_fk)
    @ManyToOne(() => Variety, (variety) => variety.sections, { nullable: true })
    @JoinColumn({ name: 'id_variety' }) 
    variety?: Variety; 

    // --- Relations OneToMany ---

    @OneToMany(() => Harvest, (harvest) => harvest.section)
    harvets: Harvest[];

    @OneToMany(() => Watering, (watering) => watering.section)
    waterings: Watering[];
}