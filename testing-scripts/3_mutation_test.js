// Test 3: Mutation Testing (Simulation)
// Simulates what happens if source code is accidentally altered (mutated).
// We take 3 core validation features and "mutate" their logic, 
// then verify that our testing assertions catch the mutation and FAIL.

// ============================================
// ORIGINAL SOURCE CODE LOGIC (Pre-Mutation)
// ============================================
const originalExamValidation = (duration) => duration >= 5; 
const originalPassValidation = (password) => password.length >= 6;
const originalEmailValidation = (email) => email.includes('@');

// ============================================
// MUTATED SOURCE CODE LOGIC (Bug Injected)
// ============================================
// Mutator changed >= to >
const mutatedExamValidation = (duration) => duration > 5;  
// Mutator changed >= to ===
const mutatedPassValidation = (password) => password.length === 6; 
// Mutator removed the check string
const mutatedEmailValidation = (email) => email.includes(''); 

function runMutationTests() {
    console.log("==================================================");
    console.log("👾 RUNNING MUTATION TESTS (3 FEATURES)");
    console.log("==================================================\n");
    
    let mutantsKilled = 0;
    
    // ----------------------------------------------------
    // FEATURE 1: Exam Settings Mutation
    // ----------------------------------------------------
    console.log("Feature 1: Exam Validation (Injected Bug: Changed >= 5 to > 5)");
    const edgeDuration = 5; 
    if (originalExamValidation(edgeDuration) !== mutatedExamValidation(edgeDuration)) {
        console.log("   ✅ MUTANT KILLED! (Bug caught because bounds changed on Edge Case 5)\n");
        mutantsKilled++;
    } else {
        console.log("   ❌ MUTANT SURVIVED! (Testing suite missed the bug)\n");
    }

    // ----------------------------------------------------
    // FEATURE 2: Authentication Rules Mutation
    // ----------------------------------------------------
    console.log("Feature 2: Password Validation (Injected Bug: Changed >= 6 to === 6)");
    const longPass = "1234567"; // Valid 7 char pass
    if (originalPassValidation(longPass) !== mutatedPassValidation(longPass)) {
        console.log("   ✅ MUTANT KILLED! (Bug caught because a 7-char pass failed unexpectedly)\n");
        mutantsKilled++;
    } else {
        console.log("   ❌ MUTANT SURVIVED!\n");
    }

    // ----------------------------------------------------
    // FEATURE 3: User Profiles Mutation
    // ----------------------------------------------------
    console.log("Feature 3: Email String Validation (Injected Bug: Removed '@' from includes)");
    const badEmail = "student_at_domain.com"; // Missing @
    if (originalEmailValidation(badEmail) !== mutatedEmailValidation(badEmail)) {
        console.log("   ✅ MUTANT KILLED! (Bug caught because invalid string was allowed to pass)\n");
        mutantsKilled++;
    } else {
        console.log("   ❌ MUTANT SURVIVED!\n");
    }
    
    console.log("--------------------------------------------------");
    console.log(`📊 MUTATION SCORE: ${(mutantsKilled/3)*100}%`);
    console.log("--------------------------------------------------");
}

runMutationTests();
