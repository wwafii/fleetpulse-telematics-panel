import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingLog } from './entities/tracking-log.entity';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { Fleet } from '../fleet/entities/fleet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TrackingLog, Fleet])],
  providers: [TrackingService],
  controllers: [TrackingController],
  exports: [TrackingService],
})
export class TrackingModule {}
