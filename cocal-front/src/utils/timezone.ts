/**
 * UTC ↔ KST 변환 유틸
 */

// UTC → KST 변환
export const utcToKst = (utcString: string): Date => {
    const utcDate = new Date(utcString);
    const kstTime = utcDate.getTime() + 9 * 60 * 60 * 1000; // +9시간
    return new Date(kstTime);
};
// KST → UTC 변환
export const kstToUtc = (kstString: string): Date => {
    const kstDate = new Date(kstString);
    const utcTime = kstDate.getTime() - 9 * 60 * 60 * 1000; // -9시간
    return new Date(utcTime);
};