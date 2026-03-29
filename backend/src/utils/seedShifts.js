// backend/src/utils/seedShifts.js
import { Shift } from '../models/shift.model.js';
import { connectDB } from '../db/index.js';
import dotenv from 'dotenv';

dotenv.config();

const shifts = [
  {
    shiftName: 'Morning',
    shiftCode: 'MORNING',
    startTime: '06:00',
    endTime: '14:00',
    // duration will be calculated by pre-save hook
    breakTime: {
      duration: 60,
      startTime: '10:00',
    },
    isActive: true,
  },
  {
    shiftName: 'Evening',
    shiftCode: 'EVENING',
    startTime: '14:00',
    endTime: '22:00',
    breakTime: {
      duration: 60,
      startTime: '18:00',
    },
    isActive: true,
  },
  {
    shiftName: 'Night',
    shiftCode: 'NIGHT',
    startTime: '22:00',
    endTime: '06:00',
    breakTime: {
      duration: 60,
      startTime: '02:00',
    },
    isActive: true,
  },
  {
    shiftName: 'Day',
    shiftCode: 'DAY',
    startTime: '08:00',
    endTime: '17:00',
    breakTime: {
      duration: 60,
      startTime: '12:00',
    },
    isActive: true,
  },
  {
    shiftName: 'General',
    shiftCode: 'GENERAL',
    startTime: '09:00',
    endTime: '18:00',
    breakTime: {
      duration: 60,
      startTime: '13:00',
    },
    isActive: true,
  },
];

async function seedShifts() {
  try {
    await connectDB();

    console.log('ðŸŒ± Starting shift seeding...\n');

    // Clear existing shifts
    await Shift.deleteMany({});
    console.log('âœ… Cleared existing shifts\n');

    // Insert shifts one by one to trigger pre-save hooks
    const insertedShifts = [];
    for (const shiftData of shifts) {
      const shift = new Shift(shiftData);
      await shift.save(); // This will trigger the pre-validate hook
      insertedShifts.push(shift);
    }

    console.log(`âœ… Successfully seeded ${insertedShifts.length} shifts:\n`);

    insertedShifts.forEach((shift) => {
      console.log(
        `   ${shift.shiftName} (${shift.shiftCode}) - ${shift.startTime} to ${shift.endTime} (${shift.duration}h)`
      );
    });

    console.log('\nðŸŽ‰ Shift seeding completed successfully!');
    console.log(`\nðŸ“Š Summary:`);
    console.log(`   Total Shifts: ${insertedShifts.length}`);
    console.log(`   Active Shifts: ${insertedShifts.filter(s => s.isActive).length}`);

    process.exit(0);
  } catch (error) {
    console.error('âŒ Error seeding shifts:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run seeder
seedShifts();