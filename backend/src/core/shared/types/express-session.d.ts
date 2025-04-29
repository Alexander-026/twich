import { SessionMetadata } from './session-metadata.types';
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    createdAt?: Date | string;
    metadata: SessionMetadata;
  }
}
