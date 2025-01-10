const { PrismaClient } = require('@prisma/client');

const oldPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.OLD_DATABASE_URL
    }
  }
});

async function checkEvent() {
  try {
    console.log('=== Memeriksa Data Event ===\n');
    
    // Ambil semua event
    const events = await oldPrisma.event.findMany();
    console.log('Events yang ada:', events);
    
    // Ambil semua tiket dengan event
    const tickets = await oldPrisma.ticket.findMany({
      include: {
        event: true
      }
    });
    console.log('\nTiket dengan event:', tickets);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await oldPrisma.$disconnect();
  }
}

checkEvent(); 