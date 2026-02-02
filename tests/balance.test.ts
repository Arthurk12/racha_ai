import { calculateBalances, calculatePairwiseDebts } from '../src/lib/balance';
import assert from 'assert';

console.log('Running Balance Logic Tests...')

// Test Case 1: Simple 50/50 split
const users1 = [{id: 'A', name: 'Alice'}, {id: 'B', name: 'Bob'}]
const expenses1 = [{amount: 100, paidBy: 'A', participants: ['A', 'B']}]
const result1 = calculateBalances(users1, expenses1)

assert.strictEqual(result1['A'], 50, 'Alice should receive 50')
assert.strictEqual(result1['B'], -50, 'Bob should owe 50')
console.log('Test Case 1 passed: Simple Split')

// Test Case 2: 3 People, one pays for all
const users2 = [{id: 'A', name: 'Alice'}, {id: 'B', name: 'Bob'}, {id: 'C', name: 'Charlie'}]
const expenses2 = [{amount: 90, paidBy: 'A', participants: ['A', 'B', 'C']}]
const result2 = calculateBalances(users2, expenses2)

assert.strictEqual(result2['A'], 60, 'Alice paid 90, share is 30, receives 60')
assert.strictEqual(result2['B'], -30, 'Bob owes 30')
assert.strictEqual(result2['C'], -30, 'Charlie owes 30')
console.log('Test Case 2 passed: 3 People Split')

// Test Case 3: Uneven payments
// A pays 100 for A, B
// B pays 40 for A, B, C
const expenses3 = [
    {amount: 100, paidBy: 'A', participants: ['A', 'B']}, // A gets +50, B gets -50 (Net A: +50, B: -50)
    {amount: 60, paidBy: 'B', participants: ['A', 'B', 'C']} // B gets +40 (paid 60, cost 20), A -20, C -20
]
// Expected:
// A: +50 - 20 = +30
// B: -50 + 40 = -10
// C: 0 - 20 = -20
// Sum: 30 - 10 - 20 = 0
const result3 = calculateBalances(users2, expenses3)

// Floating point precision might be an issue, using closeTo or checking integer math if possible
// Javascript precision handled by allowing small epsilon if needed, but here integers work out
assert.strictEqual(result3['A'], 30)
assert.strictEqual(result3['B'], -10)
assert.strictEqual(result3['C'], -20)
console.log('Test Case 3 passed: Multiple Expenses')

// Test Case 4: Circular/Offsetting Payments
// A pays 50 for B
// B pays 50 for A
const expenses4 = [
    {amount: 50, paidBy: 'A', participants: ['B']}, 
    {amount: 50, paidBy: 'B', participants: ['A']}
]
const result4 = calculateBalances(users1, expenses4)
assert.strictEqual(result4['A'], 0, 'Alice should be 0')
assert.strictEqual(result4['B'], 0, 'Bob should be 0')
console.log('Test Case 4 passed: Circular Payments')

// Test Case 5: Paying for oneself
const expenses5 = [{amount: 100, paidBy: 'A', participants: ['A']}]
const result5 = calculateBalances(users1, expenses5)
assert.strictEqual(result5['A'], 0, 'Should not affect balance if paying for self')
console.log('Test Case 5 passed: Self Payment')

// Test Case 6: Floating Point Precision
// 100 split by 3 people = 33.333... each.
// Payer pays 100. Payer share 33.333. Payer receives 66.666...
// Others owe 33.333...
const users3 = [{id: 'A', name: 'A'}, {id: 'B', name: 'B'}, {id: 'C', name: 'C'}]
const expenses6 = [{amount: 100, paidBy: 'A', participants: ['A', 'B', 'C']}]
const result6 = calculateBalances(users3, expenses6)

const closeTo = (a: number, b: number) => Math.abs(a - b) < 0.0001
assert.ok(closeTo(result6['A'], 66.6666), 'A balance approx 66.66')
assert.ok(closeTo(result6['B'], -33.3333), 'B balance approx -33.33')
assert.ok(closeTo(result6['C'], -33.3333), 'C balance approx -33.33')
console.log('Test Case 6 passed: Floating Point')

// --- Pairwise Debt Tests ---

// Test Case 7: Simple Pairwise Debt
// A pays 100 for B
const result7 = calculatePairwiseDebts(users1, [{amount: 100, paidBy: 'A', participants: ['B']}])
assert.strictEqual(result7.length, 1)
assert.strictEqual(result7[0].debtorId, 'B')
assert.strictEqual(result7[0].creditorId, 'A')
assert.strictEqual(result7[0].amount, 100)
console.log('Test Case 7 passed: Simple Pairwise')

// Test Case 8: Reciprocal Debt Cancellation
// A pays 50 for B
// B pays 30 for A 
// Net: B owes A 20
const expenses8 = [
    {amount: 50, paidBy: 'A', participants: ['B']},
    {amount: 30, paidBy: 'B', participants: ['A']}
]
const result8 = calculatePairwiseDebts(users1, expenses8)
assert.strictEqual(result8.length, 1)
assert.strictEqual(result8[0].debtorId, 'B')
assert.strictEqual(result8[0].creditorId, 'A')
assert.strictEqual(result8[0].amount, 20)
console.log('Test Case 8 passed: Reciprocal Cancellation')

// Test Case 9: No Debt Transfer (The "Julia/Felipe" case)
// A pays 100 for B (B owes A 100)
// B pays 50 for C (C owes B 50)
// Global balance would say: A needs +100, B needs -50 (+100 -50), C needs -50.
// A simplified view might suggest C pays 50 to A, B pays 50 to A.
// But pairwise should strictly show: B->A (100) and C->B (50).
const expenses9 = [
    {amount: 100, paidBy: 'A', participants: ['B']},
    {amount: 50, paidBy: 'B', participants: ['C']}
]
const result9 = calculatePairwiseDebts(users2, expenses9)
// Expect 2 debts
const debtBA = result9.find(d => d.debtorId === 'B' && d.creditorId === 'A')
const debtCB = result9.find(d => d.debtorId === 'C' && d.creditorId === 'B')

assert.ok(debtBA, 'B should owe A')
assert.strictEqual(debtBA?.amount, 100)
assert.ok(debtCB, 'C should owe B')
assert.strictEqual(debtCB?.amount, 50)
assert.strictEqual(result9.length, 2, 'Should be exactly 2 debts')
console.log('Test Case 9 passed: No Debt Transfer')


// Test Case 10: Complex Group Split
// Group: A, B, C, D
// Expense 1: A pays 400 for A, B, C, D (100 each). 
// Debts: B->A (100), C->A (100), D->A (100)
// Expense 2: B pays 200 for B, C (100 each).
// Debts: C->B (100)
// Combined:
// B->A: 100
// C->A: 100
// D->A: 100
// C->B: 100
const users4 = [{id: 'A', name: 'A'}, {id: 'B', name: 'B'}, {id: 'C', name: 'C'}, {id: 'D', name: 'D'}]
const expenses10 = [
    {amount: 400, paidBy: 'A', participants: ['A', 'B', 'C', 'D']},
    {amount: 200, paidBy: 'B', participants: ['B', 'C']}
]
const result10 = calculatePairwiseDebts(users4, expenses10)

const findDebt = (from: string, to: string) => result10.find(d => d.debtorId === from && d.creditorId === to)

assert.strictEqual(findDebt('B', 'A')?.amount, 100, 'B should owe A 100')
assert.strictEqual(findDebt('C', 'A')?.amount, 100, 'C should owe A 100')
assert.strictEqual(findDebt('D', 'A')?.amount, 100, 'D should owe A 100')
assert.strictEqual(findDebt('C', 'B')?.amount, 100, 'C should owe B 100')
assert.strictEqual(result10.length, 4, 'Should be exactly 4 debts')
console.log('Test Case 10 passed: Complex Group Split')


console.log('All tests passed successfully!')
