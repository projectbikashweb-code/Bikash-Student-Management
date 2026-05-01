import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Syncing PaymentHistory with FeeRecords...');
  
  // Find all fee records that have paidAmount > 0
  const feeRecords = await prisma.feeRecord.findMany({
    where: { paidAmount: { gt: 0 } },
    include: { payments: true }
  });

  let syncedCount = 0;

  for (const fee of feeRecords) {
    const totalPayments = fee.payments.reduce((sum, p) => sum + Number(p.amountPaid), 0);
    const difference = Number(fee.paidAmount) - totalPayments;

    if (difference > 0) {
      console.log(`Fixing FeeRecord ${fee.id} for Student ${fee.studentId}. Difference: ${difference}`);
      await prisma.paymentHistory.create({
        data: {
          feeRecordId: fee.id,
          studentId: fee.studentId,
          amountPaid: difference,
          paymentDate: fee.paidDate || fee.updatedAt || new Date(),
          paymentMode: 'CASH',
          receivedBy: 'System Sync',
          notes: 'Auto-synced missing payment record'
        }
      });
      syncedCount++;
    }
  }

  console.log(`Successfully synced ${syncedCount} missing payment records.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
