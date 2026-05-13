export class PlantableVegetableDto {
  vegetableId: number;
  vegetableName: string;
  familyId: number;
  familyName: string;
  importance: string;
  lastPlantedInSection: string | null;
  lastQuantityPlanted: number | null;
  neverPlantedInSection: boolean;
  associationWarning: boolean;
  associationWarningReason: string | null;
}
