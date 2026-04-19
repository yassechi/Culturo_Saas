import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Family } from './family.entity';
import { Variety } from './variety.entity';
import { Section } from './section.entity';
import { Price } from './price.entity';
import { OrderDetail } from './order-details.entity';

@Entity()
export class Vegetable {
  @PrimaryGeneratedColumn()
  id_vegetable: number;

  @Column()
  vegetable_name: string;

  @Column()
  planting_season: string;

  @Column()
  harvest_season: string;

  @Column()
  harvest_duration_min: number;

  @Column()
  harvest_duration_max: number;

  @Column()
  inrow_distance: number;

  @Column()
  in_row_spacing: number;

  @Column()
  estimated_yield: number;

  @ManyToOne(() => Family, (family) => family.vegetables)
  family: Family;

  @OneToMany(() => Variety, (variety) => variety.vegetable, { cascade: true })
  varieties: Variety[];

  // Relation vers Section, nullable
  @OneToMany(() => Section, (section) => section.vegetable, { nullable: true })
  sections?: Section[];

  @OneToMany(() => Price, (price) => price.vegetable)
  prices: Price[];

  @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.vegetable)
  orderDetails: OrderDetail[];
}
