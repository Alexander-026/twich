import type { Request } from 'express';
import { lookup } from 'geoip-lite';
import * as countries from 'i18n-iso-countries';
import type { SessionMetadata } from '../types/session-metadata.types';
import { IS_DEV_ENV } from './is-dev.util';
import DeviceDetector = require('device-detector-js');

countries.registerLocale(require('i18n-iso-countries/langs/en.json'));

export function getSessionMetada(
  req: Request,
  userAgent: string,
): SessionMetadata {
  const ip = IS_DEV_ENV
    ? '173.166.164.121'
    : Array.isArray(req.headers['cf-connecting-ip'])
      ? req.headers['cf-connecting-ip'][0]
      : req.headers['cf-connecting-ip'] ||
        (typeof req.headers['x-forwarded-for'] === 'string'
          ? req.headers['x-forwarded-for'].split(',')[0]
          : req.ip);

  const location = ip ? lookup(ip) : null;
  const device = new DeviceDetector().parse(userAgent);

  return {
    location: {
      country: location
        ? countries.getName(location.country, 'en') || 'Неизвестно'
        : 'Unknown',
      city: location ? location.city : 'Unknown',
      latidute: location ? location.ll[0] : 0,
      longitude: location ? location.ll[1] : 0,
    },
    device: {
      browser: device.client ? device.client.name : 'Unknown',
      os: device.os ? device.os.name : 'Unknown',
      type: device.device ? device.device.type : 'Unknown',
    },
    ip: ip || 'Unknown',
  };
}
