import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class AppSetting {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  key: string;

  @Column({ type: 'varchar', length: 500 })
  value: string;
}
