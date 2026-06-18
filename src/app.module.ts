import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { FleetModule } from './modules/fleet/fleet.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { SeedModule } from './modules/seed/seed.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Automatically synchronize schema on startup
    }),
    AuthModule,
    FleetModule,
    TrackingModule,
    SeedModule,
  ],
})
export class AppModule {}
