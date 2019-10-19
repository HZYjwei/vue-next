import { parse } from '../../src/parse'
import { NodeTypes, ElementNode } from '../../src/ast'

describe('Text', () => {
  test('directive with value', () => {
    const ast = parse('<div name=123 />')
    const directive = (ast.children[0] as ElementNode).props[0]

    console.log(directive)
    expect(directive).toStrictEqual({
      type: NodeTypes.DIRECTIVE,
      name: 'if',
      arg: undefined,
      modifiers: [],
      exp: {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: 'a',
        isStatic: false,
        loc: {
          start: { offset: 11, line: 1, column: 12 },
          end: { offset: 12, line: 1, column: 13 },
          source: 'a'
        }
      },
      loc: {
        start: { offset: 5, line: 1, column: 6 },
        end: { offset: 13, line: 1, column: 14 },
        source: 'v-if="a"'
      }
    })
  })
})
