/**
 * Calculate monthly annuity payment (ceiling to avoid shortfall).
 * @param {number} principalCents
 * @param {number} aprBps - e.g. 1800 = 18%
 * @param {number} termMonths
 * @returns {number} monthly payment in cents
 */
function calcMonthlyPayment(principalCents, aprBps, termMonths) {
  const r = (aprBps / 10000) / 12;
  if (r === 0) return Math.ceil(principalCents / termMonths);
  const factor = Math.pow(1 + r, termMonths);
  return Math.ceil(principalCents * r * factor / (factor - 1));
}

/**
 * Generate diminishing-balance amortisation schedule.
 * @param {number} principalCents
 * @param {number} aprBps
 * @param {number} termMonths
 * @param {string} disbursedAt - ISO date string
 * @returns {Array<{installment_no, due_date, principal_cents, interest_cents, total_cents}>}
 */
function generateSchedule(principalCents, aprBps, termMonths, disbursedAt) {
  const r = (aprBps / 10000) / 12;
  const pmt = calcMonthlyPayment(principalCents, aprBps, termMonths);

  const schedule = [];
  let balance = principalCents;
  const base = new Date(disbursedAt);

  for (let i = 1; i <= termMonths; i++) {
    const interestCents = Math.round(balance * r);
    let principalPart = pmt - interestCents;

    // Last installment: absorb rounding residual
    if (i === termMonths) {
      principalPart = balance;
    }

    const totalCents = principalPart + interestCents;

    const dueDate = new Date(base);
    dueDate.setMonth(dueDate.getMonth() + i);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    schedule.push({
      installment_no: i,
      due_date: dueDateStr,
      principal_cents: principalPart,
      interest_cents: interestCents,
      total_cents: totalCents,
    });

    balance -= principalPart;
    if (balance < 0) balance = 0;
  }

  return schedule;
}

module.exports = { calcMonthlyPayment, generateSchedule };
