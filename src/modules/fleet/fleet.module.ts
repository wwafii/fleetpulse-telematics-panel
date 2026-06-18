import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fleet } from './entities/fleet.entity';
import { FleetService } from './fleet.service';
import { FleetController } from './fleet.controller';
import { TrackingLog } from '../tracking/entities/tracking-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Fleet, TrackingLog])],
  providers: [FleetService],
  controllers: [FleetController],
  exports: [FleetService],
})
export class FleetModule {}
