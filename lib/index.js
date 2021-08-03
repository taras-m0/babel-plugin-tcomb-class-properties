"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = TcombClassPropertiesTypes;

var _babelPluginSyntaxFlow = _interopRequireDefault(require("babel-plugin-syntax-flow"));

var _babelPluginTcomb = _interopRequireDefault(require("babel-plugin-tcomb"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/*! @preserve */
// const SyntaxFlow = require('babel-plugin-syntax-flow')
// const Tcomb = require('babel-plugin-tcomb')
function TcombClassPropertiesTypes(_ref) {
  var parseSync = _ref.parseSync,
      transformSync = _ref.transformSync;

  function getMethodAst(varTypes, isExtends) {
    var codeVarsTypes = Object.keys(varTypes).map(function (varName) {
      return 'type ' + varName + ' = ' + varTypes[varName] + ';\n';
    }).join('');
    var codeReturnObject = '{ ' + Object.keys(varTypes).join(', ') + ' }';
    var classCode = 'class __type { __propTypes(){ \n' + codeVarsTypes + '\n' + 'return Object.assign( ' + (isExtends ? 'super.__propTypes()' : ' {}') + ', ' + codeReturnObject + ')' + '\n' + '}' + '\n' + '}';
    console.log('classCode', classCode);
    var ast = parseSync(transformSync(classCode, {
      plugins: [_babelPluginSyntaxFlow["default"], _babelPluginTcomb["default"]],
      presets: []
    }).code, {});
    console.log('ast', ast.program.body.find(function (_ref2) {
      var type = _ref2.type;
      return type == 'ClassDeclaration';
    }));
    return ast.program.body.find(function (_ref3) {
      var type = _ref3.type;
      return type == 'ClassDeclaration';
    }).body.body[0];
  }

  var vars = [];
  var isExtends = [];
  return {
    visitor: {
      TypeAlias: function TypeAlias(path) {//        console.log('TypeAlias', path.get('body'))
        // throw path.buildCodeFrameError("TypeAlias");
      },
      Class: {
        enter: function enter(path, state) {
          throw path.buildCodeFrameError('Class enter');
          isExtends.unshift(!!path.get('superClass').node);
          vars.unshift({});
        },
        exit: function exit(path) {
          path.get('body').node.body.push(getMethodAst(vars.shift(), isExtends.shift()));
        }
      },
      ClassProperty: function ClassProperty(path) {
        throw path.buildCodeFrameError('ClassProperty');
        var src = path.get('typeAnnotation').hub.getCode().substr(path.get('typeAnnotations').container.start, path.get('typeAnnotations').container.end - path.get('typeAnnotations').container.start).replace(/\=.*/, '');
        var type = src.split(/\s*\:\s*/).length < 2 ? 'any' : src.split(/\s*\:\s*/)[1].trim();
        var name = path.get('typeAnnotations').container.key.name;
        vars[0][name] = type; // console.log(
        //   'ClassProperty',
        //   path.get('typeAnnotations'),
        //   src,
        //   type
        // )
      }
    }
  };
}