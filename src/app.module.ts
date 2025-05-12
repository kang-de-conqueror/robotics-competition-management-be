import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TeamsModule } from './teams/teams.module';
import { EventsModule } from './events/events.module';
import { MatchesModule } from './matches/matches.module';
import { InspectionsModule } from './inspections/inspections.module';
import { WebsocketsModule } from './websockets/websockets.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, TeamsModule, EventsModule, MatchesModule, InspectionsModule, WebsocketsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
