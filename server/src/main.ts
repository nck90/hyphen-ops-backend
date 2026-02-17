import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  )

  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
    : true

  app.enableCors({
    origin: allowedOrigins,
    credentials: false
  })

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Hyphen Ops Backend API')
    .setDescription('Hyphen Ops backend API documentation')
    .setVersion('1.0.0')
    .build()
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('docs', app, swaggerDocument, {
    jsonDocumentUrl: 'docs-json'
  })

  app.setGlobalPrefix('api', {
    exclude: ['health']
  })

  const port = Number(process.env.PORT ?? 8787)
  await app.listen(port, '0.0.0.0')
}

void bootstrap()
