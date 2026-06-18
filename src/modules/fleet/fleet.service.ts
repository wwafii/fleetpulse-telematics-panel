import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Fleet, FleetStatus } from './entities/fleet.entity';
import { CreateFleetDto } from './dto/create-fleet.dto';
import { UpdateFleetDto } from './dto/update-fleet.dto';
import { TrackingLog } from '../tracking/entities/tracking-log.entity';

@Injectable()
export class FleetService {
  constructor(
    @InjectRepository(Fleet)
    private readonly fleetRepository: Repository<Fleet>,
    @InjectRepository(TrackingLog)
    private readonly trackingLogRepository: Repository<TrackingLog>,
  ) {}

  async create(createFleetDto: CreateFleetDto): Promise<Fleet> {
    const existing = await this.fleetRepository.findOne({
      where: { license_plate: createFleetDto.license_plate },
    });
    if (existing) {
      throw new ConflictException(`License plate '${createFleetDto.license_plate}' is already registered.`);
    }

    const fleet = this.fleetRepository.create(createFleetDto);
    return this.fleetRepository.save(fleet);
  }

  async findAll(options: { search?: string; page?: number; limit?: number }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, options.limit || 10);
    const skip = (page - 1) * limit;

    let where: any = {};
    if (options.search) {
      const searchPattern = `%${options.search}%`;
      where = [
        { license_plate: Like(searchPattern) },
        { driver_name: Like(searchPattern) },
      ];
    }

    const [items, total] = await this.fleetRepository.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: items,
      meta: {
        totalItems: total,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async findOne(id: string): Promise<Fleet> {
    const fleet = await this.fleetRepository.findOne({
      where: { id },
    });
    if (!fleet) {
      throw new NotFoundException(`Fleet with ID ${id} not found`);
    }

    // Eagerly load only the top 10 most recent tracking logs sorted by reported_at DESC
    const logs = await this.trackingLogRepository.find({
      where: { fleet_id: id },
      order: { reported_at: 'DESC' },
      take: 10,
    });

    fleet.trackingLogs = logs;
    return fleet;
  }

  async update(id: string, updateFleetDto: UpdateFleetDto): Promise<Fleet> {
    const fleet = await this.findOne(id);

    if (updateFleetDto.license_plate && updateFleetDto.license_plate !== fleet.license_plate) {
      const existing = await this.fleetRepository.findOne({
        where: { license_plate: updateFleetDto.license_plate },
      });
      if (existing) {
        throw new ConflictException(`License plate '${updateFleetDto.license_plate}' is already registered.`);
      }
    }

    Object.assign(fleet, updateFleetDto);
    return this.fleetRepository.save(fleet);
  }

  async getDashboardStats() {
    const totalVehicles = await this.fleetRepository.count();
    const activeVehicles = await this.fleetRepository.count({ where: { status: FleetStatus.ACTIVE } });
    const inactiveVehicles = await this.fleetRepository.count({ where: { status: FleetStatus.INACTIVE } });
    const maintenanceVehicles = await this.fleetRepository.count({ where: { status: FleetStatus.MAINTENANCE } });
    
    const driversResult = await this.fleetRepository
      .createQueryBuilder('fleet')
      .select('COUNT(DISTINCT(fleet.driver_name))', 'count')
      .getRawOne();
    const totalDrivers = parseInt(driversResult?.count || '0', 10);
    
    const alertsCount = await this.trackingLogRepository.count({
      where: { alert: 'Potential Fuel Theft Detected' }
    });

    return {
      totalVehicles,
      activeVehicles,
      inactiveVehicles,
      maintenanceVehicles,
      totalDrivers,
      totalAlerts: alertsCount,
    };
  }

  async findTelemetryLogs(fleetId: string): Promise<TrackingLog[]> {
    return this.trackingLogRepository.find({
      where: { fleet_id: fleetId },
      order: { reported_at: 'DESC' },
    });
  }


  async remove(id: string): Promise<void> {
    const fleet = await this.findOne(id);
    
    if (fleet.status === FleetStatus.ACTIVE) {
      throw new BadRequestException('Cannot delete a Fleet with an "Active" status (currently in transit).');
    }

    await this.fleetRepository.softDelete(id);
  }
}

