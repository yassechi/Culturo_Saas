import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User_ } from './user_.entity';
// import { Utilisateur } from './user_.entity';

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id_role: number;

  @Column()
  role_name: string;

  @OneToMany(() => User_, (user_) => user_.role)
  users: User_[];
}
