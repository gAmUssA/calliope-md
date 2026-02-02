# TypeScript Inline Code Highlighting Test

This file demonstrates the new TypeScript code highlighting feature for inline code.

## Regular Inline Code

Regular inline code without language prefix: `const x = 5`

## TypeScript Inline Code

TypeScript code with `ts:` prefix: `ts:const message: string = "Hello"`

More TypeScript examples:
- Variable declaration: `ts:let count: number = 0`
- Function type: `ts:function greet(name: string): void`
- Interface: `ts:interface User { id: number; name: string }`
- Type alias: `ts:type ID = string | number`
- Generic type: `ts:Array<T>`
- Arrow function: `ts:const add = (a: number, b: number): number => a + b`

## JavaScript Code

JavaScript code with `js:` prefix: `js:const data = { name: "John" }`

## Python Code

Python code with `py:` prefix: `py:def hello(name: str) -> None:`

## Mixed Content

You can use both regular inline code like `console.log()` and TypeScript code like `ts:interface Config { debug: boolean }` in the same paragraph.

TypeScript offers type safety with `ts:type Result = Success | Error` compared to regular `JavaScript`.
