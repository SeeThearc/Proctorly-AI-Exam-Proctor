// Test 2: Regression Testing
// Tests that previously established core business logic remains unbreakable.
const { validateExam, validatePassword, validateStudentId } = require('../backend/utils/validators');

function runRegressionTests() {
  console.log("=========================================");
  console.log("🔄 RUNNING REGRESSION TESTS (CORE LOGIC)");
  console.log("=========================================\n");

  let passed = 0;
  let failed = 0;

  // ----------------------------------------------------
  // FEATURE 1: Exam Creation Validation Rules
  // ----------------------------------------------------
  process.stdout.write("Feature 1: Exam duration boundary regression (duration < 5) ... ");
  const badExam = { title: "Test", course: "CS101", duration: 4, questions: [{ questionText: "q", options: ["a","b"], correctAnswer: 0 }] };
  const val1 = validateExam(badExam);
  
  if (!val1.valid && val1.errors.includes('Duration must be at least 5 minutes')) {
    console.log("✅ PASS (Strict duration bound enforced properly)");
    passed++;
  } else {
    console.log("❌ FAIL (Allowed invalid duration or threw wrong error)");
    failed++;
  }

  // ----------------------------------------------------
  // FEATURE 2: Authentication Security Rules
  // ----------------------------------------------------
  process.stdout.write("Feature 2: Password minimum length threshold regression ... ");
  const badPass = validatePassword("12345"); // 5 chars
  const goodPass = validatePassword("123456"); // 6 chars

  if (!badPass.valid && goodPass.valid) {
    console.log("✅ PASS (Exactly 6 char minimum rule intact)");
    passed++;
  } else {
    console.log("❌ FAIL (Password rules regressed)");
    failed++;
  }

  // ----------------------------------------------------
  // FEATURE 3: User Identity Validation Rules
  // ----------------------------------------------------
  process.stdout.write("Feature 3: Edge-case empty Student ID injection regression ... ");
  const emptyId = validateStudentId("   "); // Spaces only
  const nullId = validateStudentId(null); 
  const goodId = validateStudentId("STU1234");

  if (!emptyId.valid && !nullId.valid && goodId.valid) {
    console.log("✅ PASS (Empty/Null IDs heavily guarded against injection)");
    passed++;
  } else {
    console.log("❌ FAIL (ID check regressed, allowed empty spaces)");
    failed++;
  }

  console.log("\n-----------------------------------------");
  console.log(`📊 REGRESSION RESULTS: ${passed} Passed | ${failed} Failed`);
  console.log("-----------------------------------------");
}

runRegressionTests();
