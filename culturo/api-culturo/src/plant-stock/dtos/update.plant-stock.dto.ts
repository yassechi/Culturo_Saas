import { PartialType } from '@nestjs/swagger';
import { CreatePlantStockDto } from './create.plant-stock.dto';

export class UpdatePlantStockDto extends PartialType(CreatePlantStockDto) {}
