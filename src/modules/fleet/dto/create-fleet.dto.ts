import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { VehicleType, FleetStatus } from '../entities/fleet.entity';

export class CreateFleetDto {
  @IsNotEmpty()
  @IsString()
  license_plate: string;

  @IsNotEmpty()
  @IsEnum(VehicleType, {
    message: 'Vehicle type must be Wingbox, Blind Van, or Colt Diesel',
  })
  vehicle_type: VehicleType;

  @IsNotEmpty()
  @IsString()
  driver_name: string;

  @IsNotEmpty()
  @IsEnum(FleetStatus, {
    message: 'Status must be Active, Maintenance, or Inactive',
  })
  status: FleetStatus;
}
