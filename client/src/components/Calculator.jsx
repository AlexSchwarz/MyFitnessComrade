import { useState } from 'react'
import { Delete } from 'lucide-react'

function evaluateExpression(expr) {
  if (!expr || expr.trim() === '') return null

  // Normalize operators
  const normalized = expr.replace(/×/g, '*').replace(/÷/g, '/')

  // Tokenize: numbers (including negative at start or after operator) and operators
  const tokens = []
  let i = 0
  while (i < normalized.length) {
    const ch = normalized[i]
    if (ch === ' ') { i++; continue }

    if (ch === '-' && (tokens.length === 0 || typeof tokens[tokens.length - 1] === 'string' && '+-*/'.includes(tokens[tokens.length - 1]))) {
      // Unary minus
      let num = '-'
      i++
      while (i < normalized.length && (normalized[i] >= '0' && normalized[i] <= '9' || normalized[i] === '.')) {
        num += normalized[i]
        i++
      }
      if (num === '-') return null
      tokens.push(parseFloat(num))
    } else if ((ch >= '0' && ch <= '9') || ch === '.') {
      let num = ''
      while (i < normalized.length && (normalized[i] >= '0' && normalized[i] <= '9' || normalized[i] === '.')) {
        num += normalized[i]
        i++
      }
      tokens.push(parseFloat(num))
    } else if ('+-*/'.includes(ch)) {
      tokens.push(ch)
      i++
    } else {
      return null
    }
  }

  if (tokens.length === 0) return null

  // Remove trailing operator
  if (typeof tokens[tokens.length - 1] === 'string') tokens.pop()
  if (tokens.length === 0) return null

  // First pass: evaluate * and /
  let intermediate = [tokens[0]]
  for (let j = 1; j < tokens.length; j += 2) {
    const op = tokens[j]
    const right = tokens[j + 1]
    if (right === undefined) break
    if (op === '*' || op === '/') {
      if (op === '/' && right === 0) return null
      const left = intermediate.pop()
      intermediate.push(op === '*' ? left * right : left / right)
    } else {
      intermediate.push(op, right)
    }
  }

  // Second pass: evaluate + and -
  let result = intermediate[0]
  for (let j = 1; j < intermediate.length; j += 2) {
    const op = intermediate[j]
    const right = intermediate[j + 1]
    if (right === undefined) break
    result = op === '+' ? result + right : result - right
  }

  if (isNaN(result) || !isFinite(result)) return null
  return Math.round(result * 100) / 100
}

function Calculator({ initialValue, onUseResult }) {
  const [expression, setExpression] = useState(initialValue && !isNaN(parseFloat(initialValue)) ? initialValue : '')

  const operators = ['+', '−', '×', '÷']
  const operatorChars = ['+', '-', '×', '÷']

  const handleDigit = (digit) => {
    setExpression(prev => prev + digit)
  }

  const handleOperator = (op) => {
    setExpression(prev => {
      if (prev === '' && op !== '−') return prev
      if (prev === '' && op === '−') return '−'
      const lastChar = prev[prev.length - 1]
      if (operatorChars.includes(lastChar)) {
        return prev.slice(0, -1) + op
      }
      return prev + op
    })
  }

  const handleDecimal = () => {
    setExpression(prev => {
      // Find the current number token (after last operator)
      const parts = prev.split(/[+\-×÷]/)
      const currentNum = parts[parts.length - 1]
      if (currentNum.includes('.')) return prev
      return prev + '.'
    })
  }

  const handleBackspace = () => {
    setExpression(prev => prev.slice(0, -1))
  }

  const handleCalculate = () => {
    const val = evaluateExpression(expression)
    if (val !== null) {
      setExpression(String(val))
    }
  }

  const handleUseResult = () => {
    if (expression) {
      onUseResult(expression)
    }
  }

  const handleClear = () => {
    setExpression('')
  }

  return (
    <div className="calculator-panel">
      <div className="calc-display">
        <div className="calc-display-expression">{expression || '0'}</div>
      </div>

      <div className="calc-grid">
        {['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−'].map(btn => (
          <button
            key={btn}
            type="button"
            className={`calc-btn ${operators.includes(btn) ? 'calc-btn-operator' : ''}`}
            onClick={() => operators.includes(btn) ? handleOperator(btn) : handleDigit(btn)}
          >
            {btn}
          </button>
        ))}
        <button type="button" className="calc-btn" onClick={() => handleDigit('0')}>0</button>
        <button type="button" className="calc-btn" onClick={handleDecimal}>.</button>
        <button type="button" className="calc-btn" onClick={handleBackspace}>
          <Delete size={18} />
        </button>
        <button type="button" className="calc-btn calc-btn-operator" onClick={() => handleOperator('+')}>+</button>
      </div>

      <div className="calc-actions">
        <button
          type="button"
          className="calc-btn calc-btn-use-result"
          onClick={handleUseResult}
          disabled={!expression}
        >
          ✓
        </button>
        <button type="button" className="calc-btn calc-btn-clear" onClick={handleClear}>
          C
        </button>
        <button type="button" className="calc-btn calc-btn-calculate" onClick={handleCalculate}>
          =
        </button>
      </div>
    </div>
  )
}

export default Calculator
