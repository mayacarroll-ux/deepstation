import { z } from "zod";

const serverEnvironmentSchema = z.object({
  AUTH_SECRET: z.string().optional(),
  APP_PASSWORD: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional()
});

export const serverEnvironment = serverEnvironmentSchema.parse(process.env);

export const isProduction = process.env.NODE_ENV === "production";

export function assertProductionServerEnvironment() {
  if (!isProduction) {
    return;
  }

  const missingEnvironmentVariables = [
    ["DATABASE_URL", serverEnvironment.DATABASE_URL],
    ["AUTH_SECRET", serverEnvironment.AUTH_SECRET],
    ["APP_PASSWORD", serverEnvironment.APP_PASSWORD]
  ]
    .filter(([, environmentVariableValue]) => !environmentVariableValue)
    .map(([environmentVariableName]) => environmentVariableName);

  if (missingEnvironmentVariables.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missingEnvironmentVariables.join(
        ", "
      )}.`
    );
  }
}
