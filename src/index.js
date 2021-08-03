/*! @preserve */
import SyntaxFlow from 'babel-plugin-syntax-flow'
import Tcomb from 'babel-plugin-tcomb'

// const SyntaxFlow = require('babel-plugin-syntax-flow')
// const Tcomb = require('babel-plugin-tcomb')

export default function TcombClassPropertiesTypes({
                                                    // types: t,
                                                    // template,
                                                    parseSync,
                                                    transformSync
                                                  }) {
  function getMethodAst(varTypes, isExtends) {
    const codeVarsTypes = Object.keys(varTypes)
      .map(function(varName) {
        return 'type ' + varName + ' = ' + varTypes[varName] + ';\n'
      })
      .join('')

    const codeReturnObject = '{ ' + Object.keys(varTypes).join(', ') + ' }'

    const classCode =
      'class __type { __propTypes(){ \n' +
      codeVarsTypes +
      '\n' +
      'return Object.assign( ' +
      (isExtends ? 'super.__propTypes()' : ' {}') +
      ', ' +
      codeReturnObject +
      ')' +
      '\n' +
      '}' +
      '\n' +
      '}'

    console.log('classCode', classCode)

    const ast = parseSync(
      transformSync(classCode, {
        plugins: [SyntaxFlow, Tcomb],
        presets: []
      }).code,
      {}
    )

    console.log(
      'ast',
      ast.program.body.find(({ type }) => type == 'ClassDeclaration')
    )

    return ast.program.body.find(({ type }) => type == 'ClassDeclaration').body
      .body[0]
  }

  const vars = []
  const isExtends = []

  return {
    visitor: {
      TypeAlias(path) {
        //        console.log('TypeAlias', path.get('body'))
        // throw path.buildCodeFrameError("TypeAlias");
      },

      Class: {
        enter(path, state) {
          throw path.buildCodeFrameError('Class enter')
          isExtends.unshift(!!path.get('superClass').node)

          vars.unshift({})
        },

        exit(path) {
          path
            .get('body')
            .node.body.push(getMethodAst(vars.shift(), isExtends.shift()))
        }
      },

      ClassProperty(path) {
        throw path.buildCodeFrameError('ClassProperty')
        const src = path
          .get('typeAnnotation')
          .hub.getCode()
          .substr(
            path.get('typeAnnotations').container.start,
            path.get('typeAnnotations').container.end -
            path.get('typeAnnotations').container.start
          )
          .replace(/\=.*/, '')

        const type =
          src.split(/\s*\:\s*/).length < 2
            ? 'any'
            : src.split(/\s*\:\s*/)[1].trim()

        const name = path.get('typeAnnotations').container.key.name

        vars[0][name] = type

        // console.log(
        //   'ClassProperty',
        //   path.get('typeAnnotations'),
        //   src,
        //   type
        // )
      }
    }
  }
}
