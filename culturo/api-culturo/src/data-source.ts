import { Family_importance } from './entities/family_importance.entity';
import { OrderDetail } from './entities/order-details.entity';
import { Exploitation } from './entities/exploitation.entity';
import { SectionPlan } from './entities/section_plan.entity';
import { Amendement } from './entities/amendement.entity';
import { Vegetable } from './entities/vegetable.entity';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Treatment } from './entities/treatment.entity';
import { Watering } from './entities/watering.entity';
import { Harvest } from './entities/harvest.entity';
import { Section } from './entities/section.entity';
import { Amended } from './entities/amended.entity';
import { Treated } from './entities/treated.entity';
import { Family } from './entities/family.entity';
import { Price } from './entities/price.entity';
import { User_ } from './entities/user_.entity';
import { Order } from './entities/order.entity';
import { Board } from './entities/board.entity';
import { Sole } from './entities/sole.entity';
import { Role } from './entities/role.entity';
import 'reflect-metadata';
import { Variety } from './entities/variety.entity';
import { Observation } from './entities/observation.entity';

export const AppDataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    User_,
    Role,
    Amendement,
    Watering,
    Order,
    Exploitation,
    Family,
    Vegetable,
    Board,
    SectionPlan,
    Harvest,
    Section,
    Sole,
    OrderDetail,
    Family_importance,
    Price,
    Amended,
    Treated,
    Treatment,
    Variety,
    Observation,
  ],
  synchronize: true, // dev uniquement
};

export const AppDataSource = new DataSource(AppDataSourceOptions);
