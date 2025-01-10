const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

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

async function doBackup() {
  try {
    console.log('Memulai backup data...');
    
    // Backup semua data
    const users = await oldPrisma.user.findMany({
      include: {
        profile: true,
        sessions: true,
        wallets: {
          include: {
            transactions: true
          }
        },
        events: true,
        tickets: true,
        notifications: true
      }
    });

    const events = await oldPrisma.event.findMany();
    
    // Simpan backup ke file JSON
    const backupPath = './backup';
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath);
    }
    
    fs.writeFileSync(
      './backup/users-backup.json',
      JSON.stringify(users, null, 2)
    );

    fs.writeFileSync(
      './backup/events-backup.json',
      JSON.stringify(events, null, 2)
    );

    console.log(`Backup selesai! Total ${users.length} users dan ${events.length} events`);
    
    return { users, events };
  } catch (error) {
    console.error('Error saat backup:', error);
    throw error;
  }
}

async function migrateUser(userData, profile) {
  const { id, sessions, wallets, events, tickets, notifications, ...userDataWithoutRelations } = userData;
  return await newPrisma.user.create({
    data: {
      ...userDataWithoutRelations,
      profile: profile ? {
        create: {
          avatarUrl: profile.avatarUrl,
          bio: profile.bio,
          preferences: profile.preferences
        }
      } : undefined
    }
  });
}

async function migrateWallets(userId, wallets) {
  const walletMap = new Map();
  
  for (const wallet of wallets) {
    const { id: oldId, userId: _, transactions, ...walletData } = wallet;
    const newWallet = await newPrisma.wallet.create({
      data: {
        ...walletData,
        userId
      }
    });
    walletMap.set(oldId, newWallet.id);
    
    // Migrate transactions for this wallet
    if (transactions) {
      for (const transaction of transactions) {
        const { id, walletId: _, ...transactionData } = transaction;
        await newPrisma.transaction.create({
          data: {
            ...transactionData,
            walletId: newWallet.id
          }
        });
      }
    }
  }
  
  return walletMap;
}

async function migrateEvents(events) {
  const eventMap = new Map();
  
  console.log('\nMigrasi events:');
  for (const event of events) {
    const { id: oldId, ...eventData } = event;
    const newEvent = await newPrisma.event.create({
      data: eventData
    });
    eventMap.set(oldId, newEvent.id);
    console.log(`- Event ${oldId} -> ${newEvent.id}`);
  }
  
  return eventMap;
}

async function migrateTickets(userId, tickets, eventMap) {
  console.log(`\nMigrasi tiket untuk user ${userId}:`);
  console.log(`Total tiket: ${tickets.length}`);
  
  for (const ticket of tickets) {
    const { id, userId: _, eventId: oldEventId, ...ticketData } = ticket;
    const newEventId = eventMap.get(oldEventId);
    
    console.log(`- Tiket ID: ${id}`);
    console.log(`  Event ID lama: ${oldEventId}`);
    console.log(`  Event ID baru: ${newEventId}`);
    
    if (newEventId) {
      try {
        await newPrisma.ticket.create({
          data: {
            ...ticketData,
            userId,
            eventId: newEventId
          }
        });
        console.log(`  ✅ Tiket berhasil dimigrasikan`);
      } catch (error) {
        console.error(`  ❌ Error saat migrasi tiket:`, error);
      }
    } else {
      console.warn(`  ⚠️ Warning: Event dengan ID ${oldEventId} tidak ditemukan untuk tiket user ${userId}`);
    }
  }
}

async function migrateNotifications(userId, notifications) {
  for (const notification of notifications) {
    const { id, userId: _, ...notificationData } = notification;
    await newPrisma.notification.create({
      data: {
        ...notificationData,
        userId
      }
    });
  }
}

async function migrateData(data) {
  try {
    console.log('Memulai migrasi data ke Neon...');

    // 1. Migrate users dan profile terlebih dahulu
    const userMap = new Map();
    for (const user of data.users) {
      console.log(`\nMigrasi user: ${user.username}`);
      const newUser = await migrateUser(user, user.profile);
      userMap.set(user.id, newUser.id);
      console.log(`- User dan profile berhasil dimigrasi`);
    }
    
    // 2. Migrate events dengan user ID yang benar
    const eventMap = new Map();
    console.log('\nMigrasi events:');
    for (const event of data.events) {
      const { id: oldId, userId: oldUserId, ...eventData } = event;
      const newUserId = userMap.get(oldUserId);
      const newEvent = await newPrisma.event.create({
        data: {
          ...eventData,
          userId: newUserId
        }
      });
      eventMap.set(oldId, newEvent.id);
      console.log(`- Event ${oldId} -> ${newEvent.id}`);
    }
    console.log('Events berhasil dimigrasi');
    
    // 3. Migrate data lainnya untuk setiap user
    for (const user of data.users) {
      console.log(`\nMelanjutkan migrasi untuk user: ${user.username}`);
      const newUserId = userMap.get(user.id);
      
      // Migrate wallets dan transactions
      const walletMap = await migrateWallets(newUserId, user.wallets);
      console.log(`- Wallets dan transactions berhasil dimigrasi`);
      
      // Migrate tickets dengan event mapping
      await migrateTickets(newUserId, user.tickets, eventMap);
      console.log(`- Tickets berhasil dimigrasi`);
      
      // Migrate notifications
      await migrateNotifications(newUserId, user.notifications);
      console.log(`- Notifications berhasil dimigrasi`);
      
      console.log(`Berhasil migrasi semua data untuk user: ${user.username}`);
    }
    
    console.log('\nMigrasi selesai!');
  } catch (error) {
    console.error('Error saat migrasi:', error);
    throw error;
  }
}

async function verifyMigration() {
  try {
    console.log('Memverifikasi hasil migrasi...');
    
    const oldUserCount = await oldPrisma.user.count();
    const newUserCount = await newPrisma.user.count();
    
    console.log(`Database lama: ${oldUserCount} users`);
    console.log(`Database Neon: ${newUserCount} users`);
    
    if (oldUserCount === newUserCount) {
      console.log('Verifikasi berhasil! Jumlah data sama.');
    } else {
      console.log('Warning: Jumlah data berbeda!');
    }
  } catch (error) {
    console.error('Error saat verifikasi:', error);
    throw error;
  }
}

async function main() {
  try {
    const data = await doBackup();
    await migrateData(data);
    await verifyMigration();
  } catch (error) {
    console.error('Error dalam proses migrasi:', error);
  } finally {
    await oldPrisma.$disconnect();
    await newPrisma.$disconnect();
  }
}

main(); 