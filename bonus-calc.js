/* Integer yen/minute arithmetic, without floating-point rounding. */
(() => {
 'use strict';
 function calculate(budget, minutes, override = null, farms = minutes.map(() => 0n)) {
  const totalMinutes = minutes.reduce((sum, value) => sum + value, 0n);
  const automaticRate = totalMinutes > 0n ? budget * 60n / totalMinutes : 0n;
  const rate = override === null ? automaticRate : override;
  const amounts = minutes.map((value, i) => rate * value / 60n + farms[i]);
  const paid = amounts.reduce((sum, value) => sum + value, 0n);
  return {totalMinutes, automaticRate, rate, farms, amounts, paid, remaining: budget - paid};
 }
 if (typeof module !== 'undefined') module.exports = {calculate};
 else window.BonusMath = {calculate};
})();
