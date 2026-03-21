// node_scripts/core/types.ts

/**
 * Участник Тайного Санты (сырые данные из CSV)
 */
export interface RawParticipant {
  id: string;
  gender: string;
  wishes: string;
  ozon_address: string;
  wb_address: string;
  timestamp: string;
}

/**
 * Участник с привязкой к получателю (после жеребьёвки)
 */
export interface AssignedParticipant extends RawParticipant {
  id_santa: string; // ID получателя
}

/**
 * Результат жеребьёвки
 */
export interface DrawResult {
  assignments: Map<string, string>; // SantaId → GifteeId
  participants: AssignedParticipant[];
  duration: number;
  attempts: number;
}

/**
 * Этапы проекта
 */
export type StageNumber = 1 | 2 | 3;

export interface Stage {
  number: StageNumber;
  name: string;
  description: string;
  flags: {
    IN_SERVICE: boolean;
    SANTA_READY: boolean;
  };
}

/**
 * Настройки генерации моков
 */
export interface MockConfig {
  rowCount: number;
  batchSize: number;
  cities: string[];
  streets: string[];
  wishes: string[];
  genders: string[];
}