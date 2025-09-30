import { v7 as uuid } from 'uuid';

export class UuidService {
  public static generateUuid(): string {
    return uuid();
  }
}
