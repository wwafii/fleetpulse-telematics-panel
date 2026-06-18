import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {
  private readonly DEFAULT_ADMIN_USERNAME = 'admin';
  private readonly DEFAULT_ADMIN_PASSWORD = 'adminPassword123';
  private readonly API_KEY = 'FleetPulseSecretKey123';

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async validateUser(username: string, pass: string): Promise<boolean> {
    // Attempt database check first
    try {
      const user = await this.userRepository.findOne({ where: { username } });
      if (user) {
        return user.passwordHash === pass;
      }
    } catch (err) {
      // Fallback in case table isn't synchronized yet
    }

    // Static fallback
    return username === this.DEFAULT_ADMIN_USERNAME && pass === this.DEFAULT_ADMIN_PASSWORD;
  }

  validateApiKey(apiKey: string): boolean {
    return apiKey === this.API_KEY;
  }
}
