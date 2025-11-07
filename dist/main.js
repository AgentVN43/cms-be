"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const bodyParser = require("body-parser");
const helmet_1 = require("helmet");
const dotenv = require("dotenv");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
async function bootstrap() {
    dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env' : '.env.local' });
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use((0, helmet_1.default)());
    app.enableCors();
    await app.listen(process.env.PORT || 5000);
    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
//# sourceMappingURL=main.js.map