import { Injectable } from '@nestjs/common';
import { parse } from 'dotenv';
import { readFileSync, existsSync } from 'fs';

@Injectable()
export class ConfigService {
  private static _instance: ConfigService;

  private readonly env_config: Record<string, string | undefined>;

  private constructor(file_path: string) {
    if (existsSync(file_path)) {
      this.env_config = parse(readFileSync(file_path));
    } else {
      this.env_config = {};
    }
  }

  static getInstance(): ConfigService {
    if (ConfigService._instance == null) {
      if (process.env.NODE_ENV == null) {
        throw new Error(`env var NODE_ENV cannot be null.`);
      }
      ConfigService._instance = new ConfigService(
        `${process.env.NODE_ENV}.env`,
      );
    }
    return ConfigService._instance;
  }

  get(key: string): string {
    const val = this.env_config[key];
    if (val != null) {
      return val;
    } else if (process.env[key] != null) {
      this.env_config[key] = process.env[key];
      return this.env_config[key] as string;
    } else {
      throw new Error(`env var ${key} is undefined.`);
    }
  }
}
