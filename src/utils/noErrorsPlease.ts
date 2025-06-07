import type { ChatInputCommandInteraction } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { errorType } from "./errorType";

const errorRateLimit = new Set<string>();
export async function noErrorsPlease(interaction: ChatInputCommandInteraction) {
  process.removeAllListeners();

  const sendErrorMessage = async (
    error: Error,
    eventType: string,
    additionalInfo: string = "",
  ): Promise<void> => {
    const errorKey = `${eventType}-${additionalInfo}`;
    if (errorRateLimit.has(errorKey)) return;

    errorRateLimit.add(errorKey);
    setTimeout(() => errorRateLimit.delete(errorKey), 10000);
    await errorEmbed({ interaction, error, log: true, forward: true });
  };

  const handleError = async (error: Error, eventType: string, additionalInfo: string = "") => {
    return await sendErrorMessage(error, eventType, additionalInfo);
  };

  const processEventListeners: { [key: string]: { listener: (...args: any[]) => Promise<void> } } =
    {
      unhandledRejection: {
        listener: async (reason, promise) => {
          return await handleError(errorType(reason), "unhandledRejection", `Promise: ${promise}`);
        },
      },
      uncaughtException: {
        listener: async (error, origin) => {
          return await handleError(errorType(error), "uncaughtException", `Origin: ${origin}`);
        },
      },
    };

  for (const [event, { listener }] of Object.entries(processEventListeners))
    process.on(event, async (...args) => {
      try {
        return await listener(...args);
      } catch (err) {
        return await handleError(errorType(err), "listenerError", `Event: ${event}`);
      }
    });
}
