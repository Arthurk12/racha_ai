import { calculateBalances } from '../src/lib/balance';
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

console.log('All tests passed successfully!')
