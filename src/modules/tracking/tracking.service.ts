import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackingLog } from './entities/tracking-log.entity';
import { CreateTrackingLogDto } from './dto/create-tracking-log.dto';
import { Fleet, FleetStatus } from '../fleet/entities/fleet.entity';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    @InjectRepository(TrackingLog)
    private readonly trackingLogRepository: Repository<TrackingLog>,
    @InjectRepository(Fleet)
    private readonly fleetRepository: Repository<Fleet>,
  ) {}

  async create(createTrackingLogDto: CreateTrackingLogDto) {
    const { fleet_id, fuel_level } = createTrackingLogDto;

    // 1. Validate Target Fleet
    const fleet = await this.fleetRepository.findOne({ where: { id: fleet_id } });
    if (!fleet) {
      throw new NotFoundException(`Fleet with ID ${fleet_id} not found.`);
    }

    // 2. Automatically update Fleet's status to 'Active' if it was 'Inactive'
    if (fleet.status === FleetStatus.INACTIVE) {
      fleet.status = FleetStatus.ACTIVE;
      await this.fleetRepository.save(fleet);
      this.logger.log(`Fleet ${fleet.license_plate} status updated from Inactive to Active due to incoming telemetry.`);
    }

    // 3. Fuel Drop Detection
    let alertMessage: string | null = null;
    const lastLog = await this.trackingLogRepository.findOne({
      where: { fleet_id },
      order: { reported_at: 'DESC' },
    });

    if (lastLog) {
      const fuelDrop = lastLog.fuel_level - fuel_level;
      if (fuelDrop > 30) {
        alertMessage = 'Potential Fuel Theft Detected';
        this.logger.warn(
          `ALERT: Potential Fuel Theft Detected for Fleet ID ${fleet_id} (${fleet.license_plate}). Fuel level dropped suddenly from ${lastLog.fuel_level}% to ${fuel_level}% (drop of ${fuelDrop}%).`,
        );
      }
    }

    // 4. Create and Save Tracking Log
    const newLog = this.trackingLogRepository.create({
      ...createTrackingLogDto,
      alert: alertMessage,
      reported_at: new Date(),
    });

    const savedLog = await this.trackingLogRepository.save(newLog);

    return {
      log: savedLog,
      alert: alertMessage,
    };
  }

  async findLogsForFleet(fleetId: string, limit = 10): Promise<TrackingLog[]> {
    return this.trackingLogRepository.find({
      where: { fleet_id: fleetId },
      order: { reported_at: 'DESC' },
      take: limit,
    });
  }

  async remove(id: string): Promise<string> {
    const log = await this.trackingLogRepository.findOne({ where: { id } });
    if (!log) {
      throw new NotFoundException(`Tracking log with ID ${id} not found.`);
    }
    const fleetId = log.fleet_id;
    await this.trackingLogRepository.remove(log);
    return fleetId;
  }
}

