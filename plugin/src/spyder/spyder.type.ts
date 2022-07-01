export interface SpyTime {
  second: number; // 小于这个时间进行一次爬取
  minute: number; // 间隔时间
  hour?: number;
  startHour?: number;
  endHour?: number;
}
