const { PrismaClient } = require('@prisma/client');

// Inisialisasi Prisma Client untuk database lama
const oldPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.OLD_DATABASE_URL
    }
  }
});

// Inisialisasi Prisma Client untuk database baru (Neon)
const newPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.NEW_DATABASE_URL
    }
  }
});

async function verifyDetailedMigration() {
  try {
    console.log('=== Verifikasi Detail Migrasi ===\n');
    
    // Verifikasi User
    const oldUsers = await oldPrisma.user.count();
    const newUsers = await newPrisma.user.count();
    console.log('Users:');
    console.log(`- Database lama: ${oldUsers}`);
    console.log(`- Database Neon: ${newUsers}`);
    console.log(`- Status: ${oldUsers === newUsers ? '✅ OK' : '❌ Berbeda'}\n`);
    
    // Verifikasi Profile
    const oldProfiles = await oldPrisma.userProfile.count();
    const newProfiles = await newPrisma.userProfile.count();
    console.log('Profiles:');
    console.log(`- Database lama: ${oldProfiles}`);
    console.log(`- Database Neon: ${newProfiles}`);
    console.log(`- Status: ${oldProfiles === newProfiles ? '✅ OK' : '❌ Berbeda'}\n`);
    
    // Verifikasi Wallet
    const oldWallets = await oldPrisma.wallet.count();
    const newWallets = await newPrisma.wallet.count();
    console.log('Wallets:');
    console.log(`- Database lama: ${oldWallets}`);
    console.log(`- Database Neon: ${newWallets}`);
    console.log(`- Status: ${oldWallets === newWallets ? '✅ OK' : '❌ Berbeda'}\n`);
    
    // Verifikasi Event
    const oldEvents = await oldPrisma.event.count();
    const newEvents = await newPrisma.event.count();
    console.log('Events:');
    console.log(`- Database lama: ${oldEvents}`);
    console.log(`- Database Neon: ${newEvents}`);
    console.log(`- Status: ${oldEvents === newEvents ? '✅ OK' : '❌ Berbeda'}\n`);
    
    // Verifikasi Ticket
    const oldTickets = await oldPrisma.ticket.count();
    const newTickets = await newPrisma.ticket.count();
    console.log('Tickets:');
    console.log(`- Database lama: ${oldTickets}`);
    console.log(`- Database Neon: ${newTickets}`);
    console.log(`- Status: ${oldTickets === newTickets ? '✅ OK' : '❌ Berbeda'}\n`);
    
    // Verifikasi Notification
    const oldNotifications = await oldPrisma.notification.count();
    const newNotifications = await newPrisma.notification.count();
    console.log('Notifications:');
    console.log(`- Database lama: ${oldNotifications}`);
    console.log(`- Database Neon: ${newNotifications}`);
    console.log(`- Status: ${oldNotifications === newNotifications ? '✅ OK' : '❌ Berbeda'}\n`);
    
    // Verifikasi Transaction
    const oldTransactions = await oldPrisma.transaction.count();
    const newTransactions = await newPrisma.transaction.count();
    console.log('Transactions:');
    console.log(`- Database lama: ${oldTransactions}`);
    console.log(`- Database Neon: ${newTransactions}`);
    console.log(`- Status: ${oldTransactions === newTransactions ? '✅ OK' : '❌ Berbeda'}\n`);

  } catch (error) {
    console.error('Error saat verifikasi:', error);
  } finally {
    await oldPrisma.$disconnect();
    await newPrisma.$disconnect();
  }
}

verifyDetailedMigration(); 