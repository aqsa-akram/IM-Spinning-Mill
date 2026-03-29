// src/utils/seedDepartments.js
import { Department } from '../models/department.model.js';
import { connectDB } from '../db/index.js';
import dotenv from 'dotenv';

dotenv.config();

const departments = [
  // ========== PRODUCTION DEPARTMENTS ==========
  {
    departmentName: 'Mixing Department',
    departmentCode: 'MIX',
    departmentType: 'production',
    sequenceOrder: 1,
    description: 'Prepares and blends different fiber types (cotton, polyester, recycled) to achieve the desired quality and specifications.',
    responsibilities: 'Fiber blending, quality preparation, raw material handling',
    shiftHours: 24,
    totalStaff: 2,
  },
  {
    departmentName: 'Blow Room Department',
    departmentCode: 'BLOW',
    departmentType: 'production',
    sequenceOrder: 2,
    description: 'Cleans and opens raw fibers, removing impurities and making them suitable for carding.',
    responsibilities: 'Fiber cleaning, opening, impurity removal, three production lines operation',
    shiftHours: 24,
    totalStaff: 8,
  },
  {
    departmentName: 'Carding Department',
    departmentCode: 'CARD',
    departmentType: 'production',
    sequenceOrder: 3,
    description: 'Aligns and separates fibers into a uniform web, improving fiber quality and removing short fibers.',
    responsibilities: 'Fiber alignment, web formation, quality improvement, operating 23 carding machines',
    shiftHours: 24,
    totalStaff: 10,
    dailyCapacity: 0,
  },
  {
    departmentName: 'Drawing Department',
    departmentCode: 'DRAW',
    departmentType: 'production',
    sequenceOrder: 4,
    description: 'Combines and stretches carded slivers to ensure evenness and strength for further spinning.',
    responsibilities: 'Sliver combining, stretching, evenness control, strength optimization',
    shiftHours: 24,
    totalStaff: 2,
  },
  {
    departmentName: 'Open-End Spinning Department',
    departmentCode: 'OPEN',
    departmentType: 'production',
    sequenceOrder: 5,
    description: 'Core production stage where fibers are spun into yarn using open-end machines for various counts (0.6 to 40).',
    responsibilities: 'Yarn spinning, thread count management, quality control, operating 13 open-end machines',
    shiftHours: 24,
    totalStaff: 36,
  },
  {
    departmentName: 'Packing Department',
    departmentCode: 'PACK',
    departmentType: 'production',
    sequenceOrder: 6,
    description: 'Packs finished yarn/thread in cones, bales, or cartons for delivery and storage.',
    responsibilities: 'Thread packaging, labeling, quality checking, dispatch preparation',
    shiftHours: 24,
    totalStaff: 6,
  },
  {
    departmentName: 'Warehouse Department',
    departmentCode: 'WARE',
    departmentType: 'production',
    sequenceOrder: 7,
    description: 'Stores raw materials, semi-finished goods, and finished products with proper inventory management.',
    responsibilities: 'Inventory management, storage organization, loading operations, stock tracking',
    shiftHours: 24,
    totalStaff: 4,
  },

  // ========== SUPPORT DEPARTMENTS ==========
  {
    departmentName: 'Air Conditioning Department',
    departmentCode: 'AC',
    departmentType: 'support',
    description: 'Maintains controlled temperature and humidity to ensure fiber quality and machine efficiency.',
    responsibilities: 'Climate control, humidity management, air quality maintenance, compressor operations',
    shiftHours: 24,
    totalStaff: 8,
  },
  {
    departmentName: 'Electrical Department',
    departmentCode: 'ELEC',
    departmentType: 'support',
    description: 'Handles electrical systems, power supply, and machine wiring for uninterrupted production.',
    responsibilities: 'Power management, electrical maintenance, wiring, safety systems, fire safety',
    shiftHours: 24,
    totalStaff: 19,
  },
  {
    departmentName: 'Technical Department',
    departmentCode: 'TECH',
    departmentType: 'support',
    description: 'Provides technical expertise, machine calibration, troubleshooting, and process optimization.',
    responsibilities: 'Technical support, machine calibration, process optimization, production planning',
    shiftHours: 24,
    totalStaff: 7,
  },
  {
    departmentName: 'Laboratory Department',
    departmentCode: 'LAB',
    departmentType: 'support',
    description: 'Tests yarn quality (strength, count, blend ratio, finish) to ensure industry-standard compliance.',
    responsibilities: 'Quality testing, yarn analysis, compliance checking, documentation',
    shiftHours: 12,
    totalStaff: 2,
  },
  {
    departmentName: 'Workshop Department',
    departmentCode: 'SHOP',
    departmentType: 'support',
    description: 'Handles machine repairs, maintenance, and mechanical support.',
    responsibilities: 'Machine repair, maintenance, welding, mechanical support',
    shiftHours: 24,
    totalStaff: 6,
  },
  {
    departmentName: 'Waste Plant',
    departmentCode: 'WASTE',
    departmentType: 'support',
    description: 'Manages waste collection, recycling, and disposal operations.',
    responsibilities: 'Waste collection, sorting, recycling, disposal management',
    shiftHours: 24,
    totalStaff: 45,
  },

  // ========== EXECUTIVE & ADMINISTRATIVE ==========
  {
    departmentName: 'Executive Department',
    departmentCode: 'EXEC',
    departmentType: 'executive',
    description: 'Oversees top-level decision-making, strategy, and overall mill management.',
    responsibilities: 'Strategic planning, decision-making, overall management, leadership',
    totalStaff: 5,
  },
  {
    departmentName: 'Administrative Department',
    departmentCode: 'ADMIN',
    departmentType: 'administrative',
    description: 'Manages HR, accounts, procurement, documentation, taxation, and overall office support.',
    responsibilities: 'HR management, accounting, procurement, documentation, security, facility management',
    totalStaff: 14,
  },
];

async function seedDepartments() {
  try {
    await connectDB();

    console.log('ðŸŒ± Starting department seeding...\n');

    // Clear existing departments (optional - comment out if you don't want to delete)
    // await Department.deleteMany({});
    // console.log('âœ… Cleared existing departments\n');

    // Insert departments
    const insertedDepartments = await Department.insertMany(departments);

    console.log(`âœ… Successfully seeded ${insertedDepartments.length} departments:\n`);
    
    insertedDepartments.forEach((dept) => {
      console.log(`   ${dept.sequenceOrder || '-'}. ${dept.departmentName} (${dept.departmentCode}) - ${dept.departmentType}`);
    });

    console.log('\nðŸŽ‰ Department seeding completed successfully!');
    console.log(`\nðŸ“Š Summary:`);
    console.log(`   Total: ${insertedDepartments.length} departments`);
    console.log(`   Production: ${insertedDepartments.filter(d => d.departmentType === 'production').length}`);
    console.log(`   Support: ${insertedDepartments.filter(d => d.departmentType === 'support').length}`);
    console.log(`   Executive: ${insertedDepartments.filter(d => d.departmentType === 'executive').length}`);
    console.log(`   Administrative: ${insertedDepartments.filter(d => d.departmentType === 'administrative').length}`);

    process.exit(0);
  } catch (error) {
    console.error('âŒ Error seeding departments:', error.message);
    process.exit(1);
  }
}

// Run seeder
seedDepartments();

// To run this script: node src/utils/seedDepartments.js