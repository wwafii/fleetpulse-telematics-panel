import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { User } from '../auth/entities/user.entity';
import { Fleet } from '../fleet/entities/fleet.entity';
import { TrackingLog } from '../tracking/entities/tracking-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Fleet, TrackingLog])],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
