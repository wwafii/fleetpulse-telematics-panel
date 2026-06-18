import { IsInt, IsNotEmpty, IsNumber, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateTrackingLogDto {
  @IsNotEmpty()
  @IsUUID(undefined, { message: 'fleet_id must be a valid UUID' })
  fleet_id: string;

  @IsNotEmpty()
  @IsString()
  current_location: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0, { message: 'Fuel level must be at least 0' })
  @Max(100, { message: 'Fuel level cannot exceed 100' })
  fuel_level: number;

  @IsNotEmpty()
  @IsNumber()
  temperature: number;
}
