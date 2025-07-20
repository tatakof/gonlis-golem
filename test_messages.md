# Dialectical Debate Compliance Test Messages

This file contains test conversations to verify that the AI compliance checking system works correctly for the Enhanced Dialectical Debate GPT.

## Test Categories

### 1. COMPLIANT Responses (Should PASS compliance check)

#### Test 1.1: Basic Thesis Acceptance
**User Input:** `Take the subject "sound", it follows it is impermanent.`
**Expected COMPLIANT Response:** `I accept`
**Test Purpose:** Verify AI uses prescribed response for thesis acceptance

#### Test 1.2: Basic Thesis Rejection
**User Input:** `Take the subject "sound", it follows it is permanent.`
**Expected COMPLIANT Response:** `Why?`
**Test Purpose:** Verify AI challenges invalid thesis appropriately

#### Test 1.3: Reason Not Established
**User Input:** `Because it is visible.` (in response to sound being impermanent)
**Expected COMPLIANT Response:** `Reason not established`
**Test Purpose:** Verify AI rejects invalid reasons

#### Test 1.4: No Pervasion Response
**User Input:** `Because it is known.` (in response to sound being impermanent)
**Expected COMPLIANT Response:** `No pervasion`
**Test Purpose:** Verify AI rejects invalid pervasions

#### Test 1.5: Pervasion Acceptance
**User Input:** `It follows that if something is produced, it is impermanent.`
**Expected COMPLIANT Response:** `I accept`
**Test Purpose:** Verify AI accepts valid pervasions

#### Test 1.6: Relationship Analysis
**User Input:** `Take "produced" and "impermanent", it follows they have a relationship in terms of being predicates.`
**Expected COMPLIANT Response:** `I accept`
**Test Purpose:** Verify AI handles relationship statements

#### Test 1.7: Possibilities Response
**User Input:** `Please posit.` (after relationship acceptance)
**Expected COMPLIANT Response:** `Three possibilities` OR `Four possibilities` OR `Mutually inclusive` OR `Mutually exclusive`
**Test Purpose:** Verify AI provides correct possibilities

---

### 2. NON-COMPLIANT Responses (Should FAIL compliance check and trigger regeneration)

#### Test 2.1: Explanatory Text Addition
**User Input:** `Take the subject "sound", it follows it is impermanent.`
**NON-COMPLIANT Response:** `I accept this thesis because sound is indeed a produced phenomenon and all produced things are impermanent according to Buddhist philosophy.`
**Issue:** Added explanatory text beyond prescribed response
**Expected Action:** Regenerate with just "I accept"

#### Test 2.2: Invalid Response for Thesis
**User Input:** `Take the subject "sound", it follows it is permanent.`
**NON-COMPLIANT Response:** `That's incorrect. Sound cannot be permanent because it's a produced phenomenon.`
**Issue:** Used non-prescribed response instead of "Why?"
**Expected Action:** Regenerate with "Why?"

#### Test 2.3: Conversational Response
**User Input:** `Because it is produced.`
**NON-COMPLIANT Response:** `That's a good reason. Production does indeed entail impermanence in Buddhist logic.`
**Issue:** Conversational style instead of prescribed responses
**Expected Action:** Regenerate with "I accept" or "Reason not established" or "No pervasion"

#### Test 2.4: Multiple Response Options
**User Input:** `Take the subject "mind", it follows it is produced.`
**NON-COMPLIANT Response:** `I accept, but I could also say "Why?" depending on the context.`
**Issue:** Giving multiple options instead of single prescribed response
**Expected Action:** Regenerate with single response

#### Test 2.5: Meta-Commentary
**User Input:** `It follows that if something is audible, it is impermanent.`
**NON-COMPLIANT Response:** `Why? - though I should note this is challenging your pervasion.`
**Issue:** Added meta-commentary about the debate process
**Expected Action:** Regenerate with just "Why?"

#### Test 2.6: Modern Language
**User Input:** `Take the subject "sound", it follows it is temporary.`
**NON-COMPLIANT Response:** `Sure, I agree with that statement.`
**Issue:** Used modern casual language instead of formal responses
**Expected Action:** Regenerate with "I accept"

---

### 3. EDGE CASES (Special scenarios to test)

#### Test 3.1: Contradiction Setup (T-S-A)
**Conversation Sequence:**
1. **User:** `Take the subject "sound", it follows it is impermanent.`
2. **AI:** `I accept`
3. **User:** `Take the subject "sound", it follows it is permanent.`
4. **AI:** `I accept`
5. **User:** `T-S-A`
**Expected COMPLIANT Response:** `I acknowledge the contradiction between accepting that sound is impermanent and accepting that sound is permanent.`

#### Test 3.2: Complex Thesis
**User Input:** `Take the subject "the sound of a bell being struck in a monastery", it follows it is impermanent.`
**Expected COMPLIANT Response:** `I accept` OR `Why?`
**Test Purpose:** Verify AI handles complex subject descriptions

#### Test 3.3: Partial Formal Structure
**User Input:** `Sound is impermanent because it's produced.` (missing "Take the subject" format)
**Expected COMPLIANT Response:** Should still respond appropriately with prescribed answers

#### Test 3.4: Non-Buddhist Topics
**User Input:** `Take the subject "electron", it follows it is a particle.`
**Expected COMPLIANT Response:** `I accept` OR `Why?` (should still use prescribed format)

#### Test 3.5: Ambiguous Reason
**User Input:** `Because it changes.`
**Expected COMPLIANT Response:** `I accept` OR `Reason not established` OR `No pervasion`
**Test Purpose:** Verify AI makes appropriate choice for ambiguous cases

---

### 4. SEQUENCE TESTS (Multi-turn conversations)

#### Test 4.1: Complete Valid Sequence
```
User: Take the subject "sound", it follows it is impermanent.
AI: Why?
User: Because it is produced.
AI: No pervasion.
User: It follows that if something is produced, it is impermanent.
AI: I accept.
```
**Test Purpose:** Verify compliance maintained throughout sequence

#### Test 4.2: Relationship Analysis Sequence
```
User: Take "produced" and "impermanent", it follows they have a relationship in terms of logical connection.
AI: I accept.
User: Please posit.
AI: Mutually inclusive.
```
**Test Purpose:** Verify proper relationship analysis protocol

---

### 5. BOUNDARY TESTS (Testing limits)

#### Test 5.1: Very Long Thesis
**User Input:** `Take the subject "the sound produced by the striking of a large bronze temple bell during the morning meditation session in a Tibetan monastery located high in the mountains", it follows it is impermanent.`
**Expected COMPLIANT Response:** `I accept` OR `Why?`

#### Test 5.2: Rapid Fire Questions
**User Input:** Multiple quick theses in sequence to test consistency

#### Test 5.3: Non-English Terms
**User Input:** `Take the subject "śabda", it follows it is anitya.` (Sanskrit terms)
**Expected COMPLIANT Response:** Should maintain prescribed format

---

## Testing Instructions

### For Manual Testing:
1. Enable compliance checking using the toggle button
2. Start new conversation with reasoning model
3. Try each test message
4. Verify compliance checker triggers regeneration for NON-COMPLIANT cases
5. Verify COMPLIANT cases pass through without regeneration

### For Automated Testing:
1. Send test messages to compliance checker API directly
2. Verify classification matches expected results
3. Test regeneration produces compliant responses

### Expected Indicators:
- **Compliant:** Response streams normally
- **Non-compliant:** Shows "*[Regenerating response to comply with debate rules...]*" then new response
- **Compliance Off:** Shows "*[Compliance checking disabled - free-form response]*"

### Success Criteria:
- All COMPLIANT responses should pass without regeneration
- All NON-COMPLIANT responses should trigger regeneration  
- Regenerated responses should use only prescribed phrases
- System should never block conversation completely
- Toggle should work reliably to enable/disable checking

---

## Additional Test Scenarios

### Stress Tests:
- Very rapid message sending
- Long conversation threads (50+ exchanges)
- Switching between compliant/non-compliant modes mid-conversation

### Error Handling:
- Network failures during compliance check
- Invalid API responses
- Malformed user inputs

### Performance Tests:
- Response time with compliance checking vs without
- Memory usage during long conversations
- Multiple concurrent users

---

*Note: This test file should be used to thoroughly validate the compliance checking system before deploying to production or sharing with users.* 