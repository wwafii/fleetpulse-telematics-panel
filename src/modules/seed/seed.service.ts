import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { Fleet, VehicleType, FleetStatus } from '../fleet/entities/fleet.entity';
import { TrackingLog } from '../tracking/entities/tracking-log.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Fleet)
    private readonly fleetRepository: Repository<Fleet>,
    @InjectRepository(TrackingLog)
    private readonly trackingLogRepository: Repository<TrackingLog>,
  ) {}

  async onModuleInit() {
    try {
      this.logger.log('Initializing database seeding check...');
      await this.seedUsers();
      await this.seedFleetsAndLogs();
      this.logger.log('Database seeding check completed.');
    } catch (err) {
      this.logger.error('Error occurred during database seeding:', err);
    }
  }

  private async seedUsers() {
    const count = await this.userRepository.count();
    if (count === 0) {
      this.logger.log('No users found. Seeding admin user...');
      const admin = this.userRepository.create({
        username: 'admin',
        passwordHash: 'adminPassword123',
      });
      await this.userRepository.save(admin);
      this.logger.log('Admin user successfully seeded (Username: admin, Password: adminPassword123).');
    } else {
      this.logger.log('Users table already contains data. Skipping user seeding.');
    }
  }

  private async seedFleetsAndLogs() {
    const fleetCount = await this.fleetRepository.count();
    if (fleetCount === 0) {
      this.logger.log('No fleets found. Seeding sample fleets and tracking logs...');

      // 1. Seed Fleet: Wingbox
      const wingbox = this.fleetRepository.create({
        license_plate: 'B 9001 WX',
        vehicle_type: VehicleType.WINGBOX,
        driver_name: 'Budi Santoso',
        status: FleetStatus.ACTIVE,
      });
      const savedWingbox = await this.fleetRepository.save(wingbox);

      // 2. Seed Fleet: Blind Van
      const blindVan = this.fleetRepository.create({
        license_plate: 'L 4567 BV',
        vehicle_type: VehicleType.BLIND_VAN,
        driver_name: 'Siti Aminah',
        status: FleetStatus.ACTIVE,
      });
      const savedBlindVan = await this.fleetRepository.save(blindVan);

      // 3. Seed Fleet: Colt Diesel
      const coltDiesel = this.fleetRepository.create({
        license_plate: 'D 8888 CD',
        vehicle_type: VehicleType.COLT_DIESEL,
        driver_name: 'Anton Wijaya',
        status: FleetStatus.MAINTENANCE,
      });
      const savedColtDiesel = await this.fleetRepository.save(coltDiesel);

      this.logger.log('Sample Fleets successfully seeded.');

      // 4. Seed 5 chronological tracking logs for each fleet
      const baseTime = Date.now();
      const oneHour = 60 * 60 * 1000;

      // Tracking Logs for Wingbox
      const wingboxLocations = [
        'Jakarta Port Terminal 1',
        'Cikampek Toll Road KM 19',
        'Cipularang Toll Road KM 72',
        'Padalarang Transit Area',
        'Bandung Depot A',
      ];
      for (let i = 0; i < 5; i++) {
        const log = this.trackingLogRepository.create({
          fleet_id: savedWingbox.id,
          current_location: wingboxLocations[i],
          fuel_level: 95 - i * 5, // Decreases chronologically: 95%, 90%, 85%, 80%, 75%
          temperature: 4.5 - i * 0.3, // Cold cargo
          reported_at: new Date(baseTime - (5 - i) * oneHour),
        });
        await this.trackingLogRepository.save(log);
      }

      // Tracking Logs for Blind Van
      const blindVanLocations = [
        'Surabaya Logistics Center',
        'Gresik Bypass Road',
        'Lamongan Junction',
        'Tuban Rest Stop',
        'Rembang Depot B',
      ];
      for (let i = 0; i < 5; i++) {
        const log = this.trackingLogRepository.create({
          fleet_id: savedBlindVan.id,
          current_location: blindVanLocations[i],
          fuel_level: 80 - i * 4, // 80%, 76%, 72%, 68%, 64%
          temperature: 24.0 + i * 0.5, // Standard cargo
          reported_at: new Date(baseTime - (5 - i) * oneHour),
        });
        await this.trackingLogRepository.save(log);
      }

      // Tracking Logs for Colt Diesel (currently in maintenance, but has past logs)
      const coltDieselLocations = [
        'Bandung Main Terminal',
        'Sumedang Highway KM 12',
        'Majalengka Warehouse',
        'Cirebon Toll Road KM 188',
        'Cirebon Maintenance Station',
      ];
      for (let i = 0; i < 5; i++) {
        const log = this.trackingLogRepository.create({
          fleet_id: savedColtDiesel.id,
          current_location: coltDieselLocations[i],
          fuel_level: 60 - i * 3, // 60%, 57%, 54%, 51%, 48%
          temperature: 20.2 - i * 0.4,
          reported_at: new Date(baseTime - (5 - i) * oneHour),
        });
        await this.trackingLogRepository.save(log);
      }

      this.logger.log('Successfully seeded 15 chronological tracking logs (5 per fleet).');
    } else {
      this.logger.log('Fleets table already contains data. Skipping fleet and log seeding.');
    }
  }
}
