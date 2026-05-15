import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierOrder } from 'src/entities/supplier_order.entity';
import { SupplierOrderItem } from 'src/entities/supplier_order_item.entity';
import { Supplier } from 'src/entities/supplier.entity';
import { User_ } from 'src/entities/user_.entity';
import { Vegetable } from 'src/entities/vegetable.entity';
import { Variety } from 'src/entities/variety.entity';
import { SupplierOrderService } from './supplier-order.service';
import { SupplierOrderController } from './supplier-order.controller';
import { PlantStockModule } from 'src/plant-stock/plant-stock.module';
import { UsersModule } from 'src/users/users.module';
import { EmailModule } from 'src/email/email.module';
import { AppSettingsModule } from 'src/app-settings/app-settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SupplierOrder,
      SupplierOrderItem,
      Supplier,
      User_,
      Vegetable,
      Variety,
    ]),
    PlantStockModule,
    UsersModule,
    EmailModule,
    AppSettingsModule,
  ],
  controllers: [SupplierOrderController],
  providers: [SupplierOrderService],
  exports: [SupplierOrderService],
})
export class SupplierOrderModule {}
