export function getConfig(configs: any, testType: string) {
    return configs[testType] || configs['smoke'];
}

export function getRandomNumber(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
