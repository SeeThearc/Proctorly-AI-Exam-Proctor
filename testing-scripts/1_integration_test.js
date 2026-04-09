// Test 1: Integration Testing
// Tests the connection between the API routes, express server, and checks response formatting.

async function runIntegrationTests() {
  console.log("=========================================");
  console.log("🚀 RUNNING INTEGRATION TESTS (API LAYER)");
  console.log("=========================================\n");

  let passed = 0;
  let failed = 0;

  // ----------------------------------------------------
  // FEATURE 1: System Health & Core Server Integration
  // ----------------------------------------------------
  try {
    process.stdout.write("Feature 1: Testing GET /api/health ... ");
    const res = await fetch('http://localhost:5000/api/health');
    const data = await res.json();
    
    if (res.ok && data.success === true && data.status === 'healthy') {
      console.log("✅ PASS (Returns 200 OK and healthy status)");
      passed++;
    } else {
      console.log("❌ FAIL (Unexpected response structure)");
      failed++;
    }
  } catch (error) {
    console.log("❌ FAIL (Server not running on port 5000 or unreachable)");
    failed++;
  }

  // ----------------------------------------------------
  // FEATURE 2: Authentication Controller Integration
  // ----------------------------------------------------
  try {
    process.stdout.write("Feature 2: Testing POST /api/auth/login (Invalid login) ... ");
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "fake@test.com", password: "wrong" })
    });
    
    // We expect a 401/404/400 Bad Request, not a 500 server crash
    if (res.status === 401 || res.status === 404 || res.status === 400) {
      console.log(`✅ PASS (Properly handled bad data with status code ${res.status})`);
      passed++;
    } else {
      console.log(`❌ FAIL (Expected client error, got ${res.status})`);
      failed++;
    }
  } catch (error) {
    console.log("❌ FAIL (Server unreachable)");
    failed++;
  }

  // ----------------------------------------------------
  // FEATURE 3: Route Authorization Middleware Integration
  // ----------------------------------------------------
  try {
    process.stdout.write("Feature 3: Testing GET /api/faculty/exams (Unauthorized Access) ... ");
    // Fetching a protected route without a JWT token header
    const res = await fetch('http://localhost:5000/api/faculty/exams');
    
    if (res.status === 401) {
      console.log("✅ PASS (Route strictly protected, returned 401 Unauthorized)");
      passed++;
    } else {
      console.log(`❌ FAIL (Security breach! Expected 401, got ${res.status})`);
      failed++;
    }
  } catch (error) {
    console.log("❌ FAIL (Server unreachable)");
    failed++;
  }

  console.log("\n-----------------------------------------");
  console.log(`📊 INTEGRATION RESULTS: ${passed} Passed | ${failed} Failed`);
  console.log("-----------------------------------------");
}

runIntegrationTests();
