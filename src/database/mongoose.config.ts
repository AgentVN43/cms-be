import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

export function mongooseConfig() {
  return MongooseModule.forRootAsync({
    useFactory: (configService: ConfigService) => {
      const uri = configService.get<string>('MONGODB_URI');
      if (!uri) {
        throw new Error('❌ MONGODB_URI không được tìm thấy!');
      }
      console.log('✅ Đã load MONGODB_URI:', uri);
      return { uri };
    },
    inject: [ConfigService],
  });
}
