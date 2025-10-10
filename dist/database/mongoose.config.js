"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongooseConfig = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
function mongooseConfig() {
    return mongoose_1.MongooseModule.forRootAsync({
        useFactory: (configService) => {
            const uri = configService.get('MONGODB_URI');
            if (!uri) {
                throw new Error('❌ MONGODB_URI không được tìm thấy!');
            }
            console.log('✅ Đã load MONGODB_URI:', uri);
            return { uri };
        },
        inject: [config_1.ConfigService],
    });
}
exports.mongooseConfig = mongooseConfig;
//# sourceMappingURL=mongoose.config.js.map