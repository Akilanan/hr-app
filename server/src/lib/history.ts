import type { Prisma } from '@prisma/client';
import { prisma } from './prisma';

export interface HistoryInput {
  employeeId: string;
  eventType: string;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  occurredAt?: Date;
  createdBy?: string | null;
}

function toData(input: HistoryInput): Prisma.HistoryEventUncheckedCreateInput {
  return {
    employeeId: input.employeeId,
    eventType: input.eventType,
    title: input.title,
    description: input.description ?? null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    occurredAt: input.occurredAt ?? new Date(),
    createdBy: input.createdBy ?? null,
  };
}

/** Append an event to an employee's unified history timeline. */
export function recordHistory(input: HistoryInput) {
  return prisma.historyEvent.create({ data: toData(input) });
}

/** Same as recordHistory but participates in an existing transaction. */
export function recordHistoryTx(tx: Prisma.TransactionClient, input: HistoryInput) {
  return tx.historyEvent.create({ data: toData(input) });
}
