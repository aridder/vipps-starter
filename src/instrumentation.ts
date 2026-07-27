export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
  if (!connectionString) return;

  const configuredRatio = Number.parseFloat(
    process.env.APPLICATIONINSIGHTS_SAMPLING_RATIO ?? "0.25",
  );
  const samplingRatio =
    Number.isFinite(configuredRatio) &&
    configuredRatio >= 0 &&
    configuredRatio <= 1
      ? configuredRatio
      : 0.25;

  const { useAzureMonitor: configureAzureMonitor } = await import(
    "@azure/monitor-opentelemetry"
  );
  configureAzureMonitor({
    azureMonitorExporterOptions: { connectionString },
    samplingRatio,
  });
}
