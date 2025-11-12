import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { UserService } from './user.service';

@Injectable()
export class UserBanSchedulerService {
  private readonly logger = new Logger(UserBanSchedulerService.name);

  constructor(private readonly userService: UserService) {}

  /**
   * Check and auto-unban users every hour (every hour at minute 0)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleAutoUnban() {
    try {
      this.logger.debug('Starting auto-unban check...');
      const unbannedCount = await this.userService.unbanExpiredUsers();
      if (unbannedCount > 0) {
        this.logger.log(`Successfully auto-unbanned ${unbannedCount} users`);
      }
    } catch (error) {
      this.logger.error('Error during auto-unban check:', error);
    }
  }

  /**
   * Alternative: Check every 30 minutes for more frequent checks
   * Uncomment this if you want more frequent checks
   */
  // @Cron('0 */30 * * * *') // Every 30 minutes
  // async handleAutoUnbanFrequent() {
  //   try {
  //     this.logger.debug('Starting frequent auto-unban check...');
  //     const unbannedCount = await this.userService.unbanExpiredUsers();
  //     if (unbannedCount > 0) {
  //       this.logger.log(`Successfully auto-unbanned ${unbannedCount} users`);
  //     }
  //   } catch (error) {
  //     this.logger.error('Error during frequent auto-unban check:', error);
  //   }
  // }
}
