const calculateDynamicAmountDue = (ledger, student) => {
  if (!ledger) return 0;
  
  const studentProfile = student || ledger.student;
  if (!studentProfile) {
    return ledger.amountDue ?? 0;
  }

  const joiningDate = studentProfile.joiningDate || studentProfile.admissionDate || ledger.createdAt || new Date();
  const monthlyFeeAmount = ledger.monthlyFeeAmount || ledger.totalFee || 0;
  const totalPaidAmount = ledger.amountPaid || 0;

  const now = new Date();
  const join = new Date(joiningDate);
  let monthDiff = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
  
  // If the current day of the month is less than the joining day, a full month hasn't passed yet
  if (now.getDate() < join.getDate()) {
    monthDiff--;
  }
  
  monthDiff = Math.max(0, monthDiff);
  const monthsElapsed = monthDiff + 1;
  
  const calculatedDue = (monthsElapsed * monthlyFeeAmount) - totalPaidAmount;
  return Math.max(0, calculatedDue);
};

const deriveFeeStatus = (ledger, student) => {
  const amountDue = calculateDynamicAmountDue(ledger, student);
  const amountPaid = ledger?.amountPaid ?? 0;

  if (amountDue <= 0) {
    return "PAID";
  }
  if (amountPaid > 0) {
    return "PARTIAL";
  }
  return "PENDING";
};

module.exports = { calculateDynamicAmountDue, deriveFeeStatus };
