export function getConfig(configs: any, testType: string) {
  return configs[testType] || configs['smoke'];
}
