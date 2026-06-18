import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Fleet } from '../../fleet/entities/fleet.entity';

@Entity('tracking_logs')
export class TrackingLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fleet_id: string;

  @Column()
  current_location: string;

  @Column('int')
  fuel_level: number;

  @Column('float')
  temperature: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  reported_at: Date;

  @Column({ nullable: true })
  alert: string;

  @ManyToOne(() => Fleet, (fleet) => fleet.trackingLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fleet_id' })
  fleet: Fleet;
}
