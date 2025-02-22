export function isInvalidDate(date: Date) {
   return Number.isNaN(date.getTime());
}
