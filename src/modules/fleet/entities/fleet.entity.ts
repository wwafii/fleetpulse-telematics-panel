import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { TrackingLog } from '../../tracking/entities/tracking-log.entity';

export enum VehicleType {
  WINGBOX = 'Wingbox',
  BLIND_VAN = 'Blind Van',
  COLT_DIESEL = 'Colt Diesel',
}

export enum FleetStatus {
  ACTIVE = 'Active',
  MAINTENANCE = 'Maintenance',
  INACTIVE = 'Inactive',
}

@Entity('fleets')
export class Fleet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  license_plate: string;

  @Column({
    type: 'varchar',
  })
  vehicle_type: VehicleType;

  @Column()
  driver_name: string;

  @Column({
    type: 'varchar',
    default: FleetStatus.INACTIVE,
  })
  status: FleetStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;

  @OneToMany(() => TrackingLog, (log) => log.fleet)
  trackingLogs: TrackingLog[];
}
