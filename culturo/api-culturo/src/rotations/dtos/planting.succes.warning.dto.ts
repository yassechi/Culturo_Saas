// response/planting-success.response.ts
import { ApiProperty } from '@nestjs/swagger';

export class PlantingSuccessResponse {
  @ApiProperty({ example: 'OK' })
  status: string;

  @ApiProperty({
    description: 'Section créée avec le légume planté',
    example: {
      id_section: 1,
      section_number: 2,
      start_date: '2025-03-01T00:00:00.000Z',
      end_date: '2025-06-30T00:00:00.000Z',
      quantity_planted: 100,
      section_active: true,
      vegetable: {
        id_vegetable: 5,
        vegetable_name: 'Tomate',
      },
    },
  })
  section: any;
}

export class PlantingWarningResponse {
  @ApiProperty({ example: 'WARNING' })
  status: string;

  @ApiProperty({
    example:
      'Cette famille primaire a déjà été plantée sur cette planche dans les 5 dernières années (Rotation 5 ans).',
  })
  reason: string;

  @ApiProperty({ example: true })
  neededBypass: boolean;
}
