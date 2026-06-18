import { IsEnum, IsOptional, IsString } from 'class-validator';
import { VehicleType, FleetStatus } from '../entities/fleet.entity';

export class UpdateFleetDto {
  @IsOptional()
  @IsString()
  license_plate?: string;

  @IsOptional()
  @IsEnum(VehicleType)
  vehicle_type?: VehicleType;

  @IsOptional()
  @IsString()
  driver_name?: string;

  @IsOptional()
  @IsEnum(FleetStatus)
  status?: FleetStatus;
}
