import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Vegetable } from './vegetable.entity';
import { Section } from './section.entity';

@Entity()
export class Variety {
    @PrimaryGeneratedColumn()
    id_variety: number;
    
    @Column()
    variety_name: string;

    // Relation vers Vegetable (ManyToOne)
    @ManyToOne(() => Vegetable, (vegetable) => vegetable.varieties)
    vegetable: Vegetable;

    // Relation inverse : Sections utilisant cette variété (OneToMany)
    @OneToMany(() => Section, (section) => section.variety)
    sections: Section[];
}