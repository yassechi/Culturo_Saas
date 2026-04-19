export class PlantableVegetableDto {
  vegetableId: number;
  vegetableName: string;
  familyId: number;
  familyName: string;
  importance: string;
  lastPlantedInSection: string | null;
  neverPlantedInSection: boolean;
}
