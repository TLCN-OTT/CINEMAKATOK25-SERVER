import { Module } from "@nestjs/common";
import * as config from 'config';
import {CacheModule as NestCacheModule} from '@nestjs/cache-manager';

@Module({
    imports:[
        NestCacheModule.register({
            store: 'memory',
            max: config.get('core.cache.max'),
            ttl: config.get('core.cache.ttl'),
        }),
    ],
    exports: [NestCacheModule],
})
export class CacheModule {}